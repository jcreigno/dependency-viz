package fr.jcreigno.depsviz;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.servlet.ServletContext;

import org.apache.maven.repository.internal.MavenRepositorySystemSession;
import org.sonatype.aether.RepositorySystem;
import org.sonatype.aether.RepositorySystemSession;
import org.sonatype.aether.artifact.Artifact;
import org.sonatype.aether.collection.CollectRequest;
import org.sonatype.aether.collection.CollectResult;
import org.sonatype.aether.collection.DependencyCollectionException;
import org.sonatype.aether.graph.Dependency;
import org.sonatype.aether.graph.DependencyNode;
import org.sonatype.aether.repository.LocalRepository;
import org.sonatype.aether.repository.RemoteRepository;
import org.sonatype.aether.util.artifact.DefaultArtifact;



@Path("/tree")
@Produces( { MediaType.APPLICATION_JSON })
public class DependencyTreeHandler {

    private RemoteRepository repo = new RemoteRepository( "central", "default", "http://repo1.maven.org/maven2/" );

    @Context
    private ServletContext context;

    @GET
    @Path("{groupId}/{artifactId}/{version}")
    public String list(@PathParam("groupId") String groupId, 
        @PathParam("artifactId") String artifactId,
        @PathParam("version") String version) {
        
        RepositorySystem system = (RepositorySystem)context.getAttribute("RepositorySystem");
        RepositorySystemSession session = newRepositorySystemSession(system);
        Artifact artifact = new DefaultArtifact( groupId+":"+artifactId+":"+version );
        CollectRequest collectRequest = new CollectRequest();
        collectRequest.setRoot( new Dependency( artifact, "" ) );
        collectRequest.addRepository( repo );
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
        return visitor.toString();
    }
        
    public static RepositorySystemSession newRepositorySystemSession( RepositorySystem system ) {
        MavenRepositorySystemSession session = new MavenRepositorySystemSession();

        LocalRepository localRepo = new LocalRepository( "target/local-repo" );
        session.setLocalRepositoryManager( system.newLocalRepositoryManager( localRepo ) );

        //session.setTransferListener( new ConsoleTransferListener() );
        //session.setRepositoryListener( new ConsoleRepositoryListener() );

        // uncomment to generate dirty trees
        // session.setDependencyGraphTransformer( null );

        return session;
    }
 
}
