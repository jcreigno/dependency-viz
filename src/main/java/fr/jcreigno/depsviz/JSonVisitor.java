package fr.jcreigno.depsviz;

import org.sonatype.aether.graph.DependencyVisitor;
import org.sonatype.aether.graph.DependencyNode;

import org.sonatype.aether.artifact.Artifact;


public class JSonVisitor implements DependencyVisitor{

    private StringBuilder builder;
    
    public JSonVisitor(){
        this(new StringBuilder());
    }
    
    public JSonVisitor(StringBuilder b){
        builder = b;
    }
    
    /**
     * Notifies the visitor of a node visit before its children have been processed.
     * 
     * @param node The dependency node being visited, must not be {@code null}.
     * @return {@code true} to visit child nodes of the specified node as well, {@code false} to skip children.
     */
    public boolean visitEnter( DependencyNode node ){
        builder.append("{");
        Artifact art = node.getDependency().getArtifact();
        builder.append("\"groupId\":\"").append(art.getGroupId()).append("\",");
        builder.append("\"artifactId\":\"").append(art.getArtifactId()).append("\",");
        builder.append("\"version\":\"").append(art.getVersion()).append("\"");
        if(node.getDependency().getScope()!=null){
            builder.append(", \"scope\":\"").append(node.getDependency().getScope()).append("\"");        
        }
        if(!node.getChildren().isEmpty()){
            builder.append(", \"children\": [");   
        }
        return true;
    }

    /**
     * Notifies the visitor of a node visit after its children have been processed. Note that this method is always
     * invoked regardless whether any children have actually been visited.
     * 
     * @param node The dependency node being visited, must not be {@code null}.
     * @return {@code true} to visit siblings nodes of the specified node as well, {@code false} to skip siblings.
     */
    public boolean visitLeave( DependencyNode node ) {
        if(!node.getChildren().isEmpty()){
            builder.replace(builder.length()-1, builder.length(), "]");
        }
        builder.append("},");
        return true;
    }
    
    public String toString(){
        String res = builder.toString();
        return res.substring(0,res.length()-1);
    }
}

