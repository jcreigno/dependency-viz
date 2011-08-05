package fr.jcreigno.depsviz;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
//import javax.ws.rs.core.CacheControl;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.EntityTag;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Request;
import javax.ws.rs.core.Response;
import javax.servlet.ServletContext;

import org.apache.maven.repository.internal.MavenRepositorySystemSession;
import org.sonatype.aether.RepositorySystem;
import org.sonatype.aether.RepositorySystemSession;
import org.sonatype.aether.artifact.Artifact;
import org.sonatype.aether.collection.CollectRequest;
import org.sonatype.aether.collection.CollectResult;
import org.sonatype.aether.collection.DependencyCollectionException;
import org.sonatype.aether.collection.DependencySelector;
import org.sonatype.aether.graph.Dependency;
import org.sonatype.aether.graph.DependencyNode;
import org.sonatype.aether.repository.LocalRepository;
import org.sonatype.aether.repository.LocalRepositoryManager;
import org.sonatype.aether.repository.RemoteRepository;
import org.sonatype.aether.util.artifact.DefaultArtifact;
import org.sonatype.aether.util.graph.selector.ScopeDependencySelector;
import org.sonatype.aether.util.graph.selector.OptionalDependencySelector;
import org.sonatype.aether.util.graph.selector.ExclusionDependencySelector;
import org.sonatype.aether.util.graph.selector.AndDependencySelector;

@Path("/tree")
@Produces( { MediaType.APPLICATION_JSON })
public class DependencyTreeHandler {

    @Context
    private ServletContext context;

    @GET
    @Path("{groupId}/{artifactId}/{version}")
    public Response list(@Context Request request,
        @PathParam("groupId") String groupId, 
        @PathParam("artifactId") String artifactId,
        @PathParam("version") String version) {
        
        String name = groupId+":"+artifactId+":"+version;
        Artifact artifact = new DefaultArtifact( name );
        
        EntityTag etag = new EntityTag(name);
        Response.ResponseBuilder responseBuilder = request.evaluatePreconditions(etag);
        if (responseBuilder != null) {
              //context.log(name " + not changed..returning unmodified response code");
              return responseBuilder.status(Response.Status.NOT_MODIFIED).build();
        }
        
        RepositorySystem system = (RepositorySystem)context.getAttribute("RepositorySystem");
        RepositorySystemSession session = newRepositorySystemSession(system);
        CollectRequest collectRequest = new CollectRequest();
        collectRequest.setRoot( new Dependency( artifact, "" ) );
        collectRequest.addRepository( (RemoteRepository)context.getAttribute("repository"));
        CollectResult collectResult = null;
        try{
            collectResult = system.collectDependencies( session, collectRequest );
        }catch(DependencyCollectionException e ){
            System.out.println(e.getMessage());
            e.printStackTrace();
            throw new WebApplicationException(e, Response.Status.BAD_REQUEST);
        }
        JSonVisitor visitor = new JSonVisitor();
        collectResult.getRoot().accept(visitor);
        //CacheControl cacheControl = new CacheControl();
        //cacheControl.setMaxAge(3600);
        
        return Response.ok(visitor.toString()).tag(etag).build();
    }
        
    private RepositorySystemSession newRepositorySystemSession( RepositorySystem system ) {
        MavenRepositorySystemSession session = new MavenRepositorySystemSession();
        session.setLocalRepositoryManager((LocalRepositoryManager) context.getAttribute("local") );
        
        DependencySelector depFilter =
              new AndDependencySelector( new ScopeDependencySelector("provided"),
                                         new OptionalDependencySelector(), new ExclusionDependencySelector() );
        session.setDependencySelector( depFilter );

        //session.setTransferListener( new ConsoleTransferListener() );
        //session.setRepositoryListener( new ConsoleRepositoryListener() );

        // uncomment to generate dirty trees
        // session.setDependencyGraphTransformer( null );

        return session;
    }
 
}
