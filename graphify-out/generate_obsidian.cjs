const fs = require('fs');
const graphData = JSON.parse(fs.readFileSync('/home/emiliano_osuna/Projects/OurTime/graphify-out/graph.json', 'utf8'));

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OurTime - Graphify Obsidian View</title>
  <style>
    body { margin: 0; padding: 0; background-color: #111; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; overflow: hidden; }
    #graph { width: 100vw; height: 100vh; }
    #info { position: absolute; top: 20px; left: 20px; background: rgba(30, 30, 30, 0.9); padding: 20px; border-radius: 12px; z-index: 10; pointer-events: none; max-width: 400px; font-size: 14px; box-shadow: 0 8px 16px rgba(0,0,0,0.5); border: 1px solid #333; backdrop-filter: blur(4px); }
    .title { font-size: 20px; font-weight: bold; margin-bottom: 12px; color: #9f7aea; /* Obsidian purple-ish */ }
    .detail { margin-bottom: 6px; color: #aaa; }
    .detail span { color: #fff; font-weight: 500; word-break: break-all; }
    
    #controls { position: absolute; bottom: 20px; right: 20px; z-index: 10; background: rgba(30, 30, 30, 0.9); padding: 15px; border-radius: 12px; border: 1px solid #333; font-size: 13px; color: #aaa; }
    button { background: #9f7aea; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 8px; width: 100%; transition: background 0.2s; }
    button:hover { background: #b794f4; }
  </style>
  <script src="https://unpkg.com/force-graph"></script>
</head>
<body>
  <div id="info">
    <div class="title">Grafo Estilo Obsidian</div>
    <div class="detail">Pasa el cursor sobre un nodo para ver los detalles.</div>
    <div class="detail">Usa la rueda del ratón para hacer zoom, arrastra para moverte.</div>
  </div>
  
  <div id="controls">
    <div><strong>Nodos:</strong> ${graphData.nodes.length}</div>
    <div><strong>Relaciones:</strong> ${graphData.links.length}</div>
    <button onclick="Graph.zoomToFit(1000)">Centrar Grafo</button>
  </div>

  <div id="graph"></div>
  
  <script>
    const gData = ${JSON.stringify(graphData)};
    
    // We modify some node properties dynamically if needed
    gData.nodes.forEach(node => {
      // Assign size based on degree or just default
      node.val = Math.max(4, Math.min(20, (node.out_degree || 1) + (node.in_degree || 1)));
    });

    const Graph = ForceGraph()
      (document.getElementById('graph'))
      .graphData(gData)
      .nodeId('id')
      .nodeLabel(() => '') 
      .nodeAutoColorBy('community')
      .nodeVal('val') // Size of the node
      .linkColor(() => 'rgba(255, 255, 255, 0.15)')
      .linkWidth(1)
      .onNodeHover(node => {
        if (node) {
          document.getElementById('info').innerHTML = \`
            <div class="title">\${node.label}</div>
            <div class="detail">Archivo: <span>\${node.source_file || 'N/A'}</span></div>
            <div class="detail">Tipo: <span>\${node.file_type || 'N/A'}</span></div>
            <div class="detail">Línea: <span>\${node.source_location || 'N/A'}</span></div>
          \`;
          
          document.body.style.cursor = 'pointer';
        } else {
          document.getElementById('info').innerHTML = \`
            <div class="title">Grafo Estilo Obsidian</div>
            <div class="detail">Pasa el cursor sobre un nodo para ver los detalles.</div>
            <div class="detail">Usa la rueda del ratón para hacer zoom, arrastra para moverte.</div>
          \`;
          document.body.style.cursor = 'default';
        }
      })
      .onNodeClick(node => {
        // Zoom and center
        Graph.centerAt(node.x, node.y, 1000);
        Graph.zoom(6, 1500);
      });
      
      // Beautiful particle animation for data flow
      Graph.linkDirectionalParticles(link => (link.value || 1) > 0 ? 2 : 0)
           .linkDirectionalParticleWidth(1.5)
           .linkDirectionalParticleSpeed(0.005);
           
      // Physics configuration simulating Obsidian's graph
      Graph.d3Force('charge').strength(-200);
      Graph.d3Force('link').distance(40);
      
      // Initial zoom to fit
      setTimeout(() => {
        Graph.zoomToFit(1000, 50);
      }, 500);
  </script>
</body>
</html>
`;

fs.writeFileSync('/home/emiliano_osuna/Projects/OurTime/graphify-out/OBSIDIAN_VIEW.html', htmlContent);
console.log('Successfully created OBSIDIAN_VIEW.html');
