package fr.jcreigno.depsviz;

import java.io.File;
import java.net.MalformedURLException;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.apache.maven.repository.internal.DefaultServiceLocator;
import org.apache.maven.repository.internal.MavenRepositorySystemSession;
import org.apache.maven.settings.Mirror;
import org.apache.maven.settings.Settings;
import org.apache.maven.settings.building.DefaultSettingsBuilderFactory;
import org.apache.maven.settings.building.DefaultSettingsBuildingRequest;
import org.apache.maven.settings.building.DefaultSettingsProblem;
import org.apache.maven.settings.building.SettingsBuildingException;
import org.apache.maven.settings.building.SettingsProblem;
import org.apache.maven.settings.building.SettingsProblem.Severity;
import org.sonatype.aether.RepositorySystem;
import org.sonatype.aether.RepositorySystemSession;
import org.sonatype.aether.connector.file.FileRepositoryConnectorFactory;
import org.sonatype.aether.connector.wagon.WagonProvider;
import org.sonatype.aether.connector.wagon.WagonRepositoryConnectorFactory;
import org.sonatype.aether.repository.LocalRepository;
import org.sonatype.aether.repository.MirrorSelector;
import org.sonatype.aether.repository.RemoteRepository;
import org.sonatype.aether.spi.connector.RepositoryConnectorFactory;
import org.sonatype.aether.util.DefaultRepositoryCache;
import org.sonatype.aether.util.DefaultRepositorySystemSession;
import org.sonatype.aether.util.repository.DefaultMirrorSelector;

public class BooterContextListener implements ServletContextListener {

	private ServletContext context = null;

	public void contextDestroyed(ServletContextEvent event) {
		this.context = null;

	}

	public void contextInitialized(ServletContextEvent event) {
		this.context = event.getServletContext();
		RepositorySystem sys = newRepositorySystem();
		// setting repository system
		this.context.setAttribute("RepositorySystem", sys);
		Settings settings = null;
		try {
			settings = loadSettings(context.getInitParameter("user-settings"),
					context.getInitParameter("global-settings"));
		} catch (SettingsBuildingException e) {
			this.context.log(e.getMessage(), e);
		}

		List<RemoteRepository> repos = new ArrayList<RemoteRepository>();
		RemoteRepository central = new RemoteRepository("central", "default", getDefaultRemoteRepository());
		this.context.log("using remote repo : " + central.getUrl());
		repos.add(central);
		if (context.getInitParameter("snapshots-remote-repo") != null) {
			this.context.log("using snapshot remote repo : " + context.getInitParameter("snapshots-remote-repo"));
			RemoteRepository snaps = new RemoteRepository("snapshot", "default",
					context.getInitParameter("snapshots-remote-repo"));
			snaps.setPolicy(true, null);
			repos.add(snaps);
		}
		// setting remote repositories
		this.context.setAttribute("repositories", repos);
		// setting default session
		this.context.setAttribute("session", newSystemSession(sys, settings));
	}

	private String getDefaultRemoteRepository() {
		String init = context.getInitParameter("remote-repo");
		return init == null ? "http://repo1.maven.org/maven2/" : init;
	}

	public static RepositorySystem newRepositorySystem() {
		/*
		 * Aether's components implement org.sonatype.aether.spi.locator.Service
		 * to ease manual wiring and using the prepopulated
		 * DefaultServiceLocator, we only need to register the repository
		 * connector factories.
		 */
		DefaultServiceLocator locator = new DefaultServiceLocator();
		locator.addService(RepositoryConnectorFactory.class, FileRepositoryConnectorFactory.class);
		locator.addService(RepositoryConnectorFactory.class, WagonRepositoryConnectorFactory.class);
		locator.setServices(WagonProvider.class, new ManualWagonProvider());

		return locator.getService(RepositorySystem.class);
	}

	private Settings loadSettings(String user, String global) throws SettingsBuildingException {
		DefaultSettingsBuildingRequest request = new DefaultSettingsBuildingRequest();
		if (user != null) {
			request.setUserSettingsFile(resolveFile(user));
		}
		if (global != null) {
			request.setGlobalSettingsFile(resolveFile(global));
		}
		request.setSystemProperties(System.getProperties());
		request.setUserProperties(new Properties());
		Settings settings = new DefaultSettingsBuilderFactory().newInstance().build(request).getEffectiveSettings();
		return settings;
	}


	/**
	 * Try to load file from ServletContext.
	 * 
	 * @param filename
	 *            file to load
	 * @return corresonding file.
	 * @throws SettingsBuildingException
	 */
	private File resolveFile(String filename) throws SettingsBuildingException {
		File file = new File(this.context.getRealPath(filename));
		return file.exists() ? file : new File(filename);
	}

	/**
	 * build problem list from exception.
	 * 
	 * @param file
	 *            settings file.
	 * @param e
	 *            exception
	 * @return problem list
	 */
	private List<SettingsProblem> explainProblems(String file, Exception e) {
		List<SettingsProblem> pbs = new ArrayList<SettingsProblem>();
		SettingsProblem pb = new DefaultSettingsProblem(e.getMessage(), Severity.ERROR, file, -1, -1, e);
		pbs.add(pb);
		return pbs;
	}

	public RepositorySystemSession newSystemSession(RepositorySystem sys, Settings settings) {
		DefaultRepositorySystemSession session = new MavenRepositorySystemSession();

		Map<String, Object> configProps = new LinkedHashMap<String, Object>();
		putAllEnvProperties(configProps);
		session.setConfigProperties(configProps);

		session.setOffline(settings.isOffline());
		// session.setUserProperties(settings.getUserProperties());

		LocalRepository localRepo = new LocalRepository(getDefaultLocalRepoDir(settings));
		session.setLocalRepositoryManager(sys.newLocalRepositoryManager(localRepo));

		// session.setProxySelector(getProxySelector());
		session.setMirrorSelector(getMirrorSelector(settings));
		// session.setAuthenticationSelector(getAuthSelector());

		session.setCache(new DefaultRepositoryCache());

		// session.setRepositoryListener(new AntRepositoryListener(task));

		// session.setWorkspaceReader(ProjectWorkspaceReader.getInstance());

		return session;
	}

	private MirrorSelector getMirrorSelector(Settings settings) {
		DefaultMirrorSelector selector = new DefaultMirrorSelector();
		for (Mirror mirror : settings.getMirrors()) {
			selector.add(String.valueOf(mirror.getId()), mirror.getUrl(), mirror.getLayout(), false,
					mirror.getMirrorOf(), mirror.getMirrorOfLayouts());
		}

		return selector;
	}

	private File getDefaultLocalRepoDir(Settings settings) {
		if (settings.getLocalRepository() != null) {
			return new File(settings.getLocalRepository());
		}
		return new File(new File(System.getProperty("user.home"), ".m2"), "repository");
	}

	private void putAllEnvProperties(Map<String, Object> configProps) {
		for (Map.Entry<Object, Object> e : System.getProperties().entrySet()) {
			configProps.put((String) e.getKey(), String.valueOf(e.getValue()));
		}
	}
}
