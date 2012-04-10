package fr.jcreigno.depsviz;

import java.util.List;

import javax.servlet.ServletContext;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.CacheControl;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Request;
import javax.ws.rs.core.Response;

import org.sonatype.aether.RepositorySystem;
import org.sonatype.aether.RepositorySystemSession;
import org.sonatype.aether.artifact.Artifact;
import org.sonatype.aether.collection.CollectRequest;
import org.sonatype.aether.collection.CollectResult;
import org.sonatype.aether.collection.DependencyCollectionException;
import org.sonatype.aether.collection.DependencySelector;
import org.sonatype.aether.graph.Dependency;
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
			@PathParam("artifactId") String artifactId) {
		RepositorySystemSession session = newRepositorySystemSession();
		try {
			Artifact artifact = new DefaultArtifact(groupId, artifactId, "pom", "[0.0.1,)");
			VersionRangeRequest arequest = new VersionRangeRequest(artifact, repositories, null);
			VersionRangeResult ars = system.resolveVersionRange(session, arequest);
			List<Version> vs = ars.getVersions();
			StringBuilder builder = new StringBuilder("[");
			for (Version v : vs) {
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
			@PathParam("artifactId") String artifactId, @PathParam("version") String version) {

		Artifact artifact = new DefaultArtifact(groupId, artifactId, "pom", version);
		boolean snapshot = artifact.isSnapshot();

		// EntityTag etag = new EntityTag(name);
		CacheControl cc = new CacheControl();
		cc.setMaxAge(snapshot ? 180 : 3600);
		// must revalidate snapshots
		cc.setMustRevalidate(snapshot);

		RepositorySystemSession session = newRepositorySystemSession();

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

		DependencySelector depFilter = new AndDependencySelector(new ScopeDependencySelector("provided"),
				new OptionalDependencySelector(), new ExclusionDependencySelector());
		session.setDependencySelector(depFilter);

		// session.setTransferListener( new ConsoleTransferListener() );
		// session.setRepositoryListener( new ConsoleRepositoryListener() );

		// uncomment to generate dirty trees
		// session.setDependencyGraphTransformer( null );

		return session;
	}

}
