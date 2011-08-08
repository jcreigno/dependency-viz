package fr.jcreigno.depsviz;

import javax.servlet.ServletContextListener;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContext;

import org.apache.maven.repository.internal.DefaultServiceLocator;
import org.sonatype.aether.RepositorySystem;
import org.sonatype.aether.repository.LocalRepository;
import org.sonatype.aether.repository.RemoteRepository;
import org.sonatype.aether.connector.file.FileRepositoryConnectorFactory;
import org.sonatype.aether.connector.wagon.WagonProvider;
import org.sonatype.aether.connector.wagon.WagonRepositoryConnectorFactory;
import org.sonatype.aether.spi.connector.RepositoryConnectorFactory;

public class BooterContextListener implements ServletContextListener {

  private ServletContext context = null;

  public void contextDestroyed(ServletContextEvent event) {
    this.context = null;

  }

  public void contextInitialized(ServletContextEvent event) {
    this.context = event.getServletContext();
    RepositorySystem sys = newRepositorySystem();
    this.context.setAttribute("RepositorySystem", sys);
    this.context.log("using remote repo : " + context.getInitParameter("remote-repo"));
    this.context.setAttribute("repository", 
        new RemoteRepository( "central", "default", context.getInitParameter("remote-repo")));
    if(context.getInitParameter("snapshots-remote-repo") != null){
        this.context.log("using snapshot remote repo : " + context.getInitParameter("snapshots-remote-repo"));
        RemoteRepository snaps = new RemoteRepository( "snapshot", "default", context.getInitParameter("snapshots-remote-repo"));
        snaps.setPolicy(true,null);
        this.context.setAttribute("snapshots", snaps);
            
    }
    this.context.log("using local repo : " + context.getInitParameter("local-repo"));
    this.context.setAttribute("local", 
        sys.newLocalRepositoryManager(new LocalRepository( context.getInitParameter("local-repo"))));
  }
  
  public static RepositorySystem newRepositorySystem()
    {
        /*
         * Aether's components implement org.sonatype.aether.spi.locator.Service to ease manual wiring and using the
         * prepopulated DefaultServiceLocator, we only need to register the repository connector factories.
         */
        DefaultServiceLocator locator = new DefaultServiceLocator();
        locator.addService( RepositoryConnectorFactory.class, FileRepositoryConnectorFactory.class );
        locator.addService( RepositoryConnectorFactory.class, WagonRepositoryConnectorFactory.class );
        locator.setServices( WagonProvider.class, new ManualWagonProvider() );

        return locator.getService( RepositorySystem.class );
    }

}
