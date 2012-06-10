package fr.jcreigno.depsviz;

import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import javax.servlet.ServletContext;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.CacheControl;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.core.Request;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.UriInfo;

import org.sonatype.aether.RepositorySystem;
import org.sonatype.aether.RepositorySystemSession;
import org.sonatype.aether.artifact.Artifact;
import org.sonatype.aether.collection.CollectRequest;
import org.sonatype.aether.collection.CollectResult;
import org.sonatype.aether.collection.DependencyCollectionException;
import org.sonatype.aether.collection.DependencySelector;
import org.sonatype.aether.graph.Dependency;
import org.sonatype.aether.graph.Exclusion;
import org.sonatype.aether.repository.RemoteRepository;
import org.sonatype.aether.resolution.ArtifactRequest;
import org.sonatype.aether.resolution.ArtifactResolutionException;
import org.sonatype.aether.resolution.ArtifactResult;
import org.sonatype.aether.resolution.VersionRangeRequest;
import org.sonatype.aether.resolution.VersionRangeResolutionException;
import org.sonatype.aether.resolution.VersionRangeResult;
import org.sonatype.aether.util.DefaultRepositorySystemSession;
import org.sonatype.aether.util.artifact.DefaultArtifact;
import org.sonatype.aether.util.graph.TreeDependencyVisitor;
import org.sonatype.aether.util.graph.selector.AndDependencySelector;
import org.sonatype.aether.util.graph.selector.ExclusionDependencySelector;
import org.sonatype.aether.util.graph.selector.OptionalDependencySelector;
import org.sonatype.aether.util.graph.selector.ScopeDependencySelector;
import org.sonatype.aether.version.Version;

@Path("/tree")
@Produces({ MediaType.APPLICATION_JSON })
public class DependencyTreeHandler {

	private RepositorySystem system = null;
	private RepositorySystemSession defaultSession = null;
	private List<RemoteRepository> repositories = null;
	private ServletContext context = null;

	public DependencyTreeHandler(@Context ServletContext ctx) {
		context = ctx;
		system = (RepositorySystem) context.getAttribute("RepositorySystem");
		defaultSession = (RepositorySystemSession) context.getAttribute("session");
		repositories = (List<RemoteRepository>) context.getAttribute("repositories");
	}

	@GET
	@Path("{groupId}/{artifactId}")
	public Response versions(@Context Request request, @PathParam("groupId") String groupId,
			@PathParam("artifactId") String artifactId, @QueryParam("q")String query) {
		RepositorySystemSession session = newRepositorySystemSession();

        String q = query == null ? "[0.0.1,)": "["+query+",)";
		try {
			Artifact artifact = new DefaultArtifact(groupId, artifactId, "pom", q);
			VersionRangeRequest arequest = new VersionRangeRequest(artifact, repositories, null);
			VersionRangeResult ars = system.resolveVersionRange(session, arequest);
			List<Version> vs = ars.getVersions();
			StringBuilder builder = new StringBuilder("[");
            boolean first = true;
			for (Version v : vs) {
                if(!first){
                    builder.append(',');
                }else{
                    first = false;
                }
				builder.append('\'').append(v.toString()).append('\'');
			}
			builder.append(']');
			return Response.ok(builder.toString()).build();
		} catch (VersionRangeResolutionException e) {
			return Response.status(Response.Status.NOT_FOUND).entity(e.getMessage()).type("text/plain").build();
		}
	}

	@GET
	@Path("{groupId}/{artifactId}/{version}")
	public Response list(@Context Request request, @PathParam("groupId") String groupId,
			@PathParam("artifactId") String artifactId, @PathParam("version") String version, @Context UriInfo infos) {

		Artifact artifact = new DefaultArtifact(groupId, artifactId, "pom", version);
		boolean snapshot = artifact.isSnapshot();

		// EntityTag etag = new EntityTag(name);
		CacheControl cc = new CacheControl();
		cc.setMaxAge(snapshot ? 180 : 3600);
		// must revalidate snapshots
		cc.setMustRevalidate(snapshot);

		RepositorySystemSession session = newRepositorySystemSession(infos.getQueryParameters());

		try {
			ArtifactRequest arequest = new ArtifactRequest(artifact, repositories, null);
			ArtifactResult ars = system.resolveArtifact(session, arequest);
			artifact = ars.getArtifact();
		} catch (ArtifactResolutionException e) {
			return Response.status(Response.Status.NOT_FOUND).entity(e.getMessage()).type("text/plain").build();
		}

		CollectRequest collectRequest = new CollectRequest(new Dependency(artifact, ""), repositories);
		CollectResult collectResult = null;
		try {
			collectResult = system.collectDependencies(session, collectRequest);
		} catch (DependencyCollectionException e) {
			context.log(e.getMessage(), e);
			throw new WebApplicationException(e, Response.Status.BAD_REQUEST);
		} catch (IllegalArgumentException e) {
			context.log(e.getMessage(), e);
			throw new WebApplicationException(e, Response.Status.BAD_REQUEST);
		}
		JSonVisitor visitor = new JSonVisitor();
		collectResult.getRoot().accept(new TreeDependencyVisitor(visitor));
		return Response.ok(visitor.toString()).cacheControl(cc)
		/* .tag(etag) */.build();
	}

	private RepositorySystemSession newRepositorySystemSession() {
		DefaultRepositorySystemSession session = new DefaultRepositorySystemSession(defaultSession);

		ScopeDependencySelector scopeSelector = new ScopeDependencySelector("provided");
		ExclusionDependencySelector excludes = new ExclusionDependencySelector();
		DependencySelector depFilter = new AndDependencySelector(scopeSelector, new OptionalDependencySelector(),
				excludes);
		session.setDependencySelector(depFilter);

		return session;
	}

	private RepositorySystemSession newRepositorySystemSession(MultivaluedMap<String, String> map) {
		DefaultRepositorySystemSession session = new DefaultRepositorySystemSession(defaultSession);

		List<String> list = map.get("filter.scope");
		String scope = list == null ? "provided" : list.iterator().next();
		ScopeDependencySelector scopeSelector = new ScopeDependencySelector(scope);
		List<String> listexcludes = map.get("filter.excludes");

		ExclusionDependencySelector excludes = new ExclusionDependencySelector(toExclusion(listexcludes));
		DependencySelector depFilter = new AndDependencySelector(scopeSelector, new OptionalDependencySelector(),
				excludes);
		session.setDependencySelector(depFilter);

		return session;
	}

	private Set<Exclusion> toExclusion(List<String> listexcludes) {
		if (listexcludes == null || listexcludes.isEmpty()) {
			return null;
		}
		TreeSet<Exclusion> res = new TreeSet<Exclusion>();
		for (String string : listexcludes) {
			String[] parts = string.split(":");
			Exclusion exclusion = new Exclusion(parts[0], parts.length > 2 ? parts[1] : "*", parts.length > 3 ? parts[2]
					: "*", parts.length > 4 ? parts[3] : "*");
			res.add(exclusion);
		}
		return res;
	}

}
