package fr.jcreigno.depsviz;

import javax.servlet.ServletContextListener;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContext;

import org.apache.maven.repository.internal.DefaultServiceLocator;
import org.sonatype.aether.RepositorySystem;
import org.sonatype.aether.connector.file.FileRepositoryConnectorFactory;
import org.sonatype.aether.connector.wagon.WagonProvider;
import org.sonatype.aether.connector.wagon.WagonRepositoryConnectorFactory;
import org.sonatype.aether.spi.connector.RepositoryConnectorFactory;

public class BooterContextListener implements ServletContextListener {

  private ServletContext context = null;

  public void contextDestroyed(ServletContextEvent event) {
    //Output a simple message to the server's console
    this.context = null;

  }


  public void contextInitialized(ServletContextEvent event) {
    this.context = event.getServletContext();
    this.context.setAttribute("RepositorySystem",newRepositorySystem());
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
