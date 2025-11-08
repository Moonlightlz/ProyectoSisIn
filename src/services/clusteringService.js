// Funciones utilitarias simples para preprocesamiento y KMeans
// El archivo contiene implementaciones ligeras usadas por el panel de clustering.

// Normaliza por Z-score
export function zScoreNormalize(matrix) {
  if (!matrix || matrix.length === 0) return matrix;
  const cols = matrix[0].length;
  const means = new Array(cols).fill(0);
  const stds = new Array(cols).fill(0);
  const n = matrix.length;

  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < n; i++) means[j] += matrix[i][j];
    means[j] /= n;
  }
  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < n; i++) stds[j] += Math.pow(matrix[i][j] - means[j], 2);
    stds[j] = Math.sqrt(stds[j] / n) || 1;
  }
  const out = matrix.map(row => row.map((v, j) => (v - means[j]) / stds[j]));
  return { matrix: out, means, stds };
}

// KMeans simple (euclidean). Devuelve labels y centroids.
export function kmeans(data, k, maxIter = 100) {
  const n = data.length;
  if (n === 0) return { labels: [], centroids: [] };
  const dim = data[0].length;

  const randIndex = () => Math.floor(Math.random() * n);
  // Inicializar centroides con k puntos aleatorios
  const centroids = [];
  const used = new Set();
  while (centroids.length < k) {
    const r = randIndex();
    if (used.has(r)) continue;
    used.add(r);
    centroids.push([...data[r]]);
  }

  const labels = new Array(n).fill(-1);

  const dist2 = (a, b) => {
    let s = 0;
    for (let i = 0; i < dim; i++) s += (a[i] - b[i]) * (a[i] - b[i]);
    return s;
  };

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    // asignación
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestD = dist2(data[i], centroids[0]);
      for (let c = 1; c < k; c++) {
        const d = dist2(data[i], centroids[c]);
        if (d < bestD) { bestD = d; best = c; }
      }
      if (labels[i] !== best) { labels[i] = best; changed = true; }
    }

    // recomputar centroides
    const sums = Array.from({ length: k }, () => new Array(dim).fill(0));
    const counts = new Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      const l = labels[i];
      counts[l] += 1;
      for (let j = 0; j < dim; j++) sums[l][j] += data[i][j];
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] === 0) continue;
      for (let j = 0; j < dim; j++) centroids[c][j] = sums[c][j] / counts[c];
    }

    if (!changed) break;
  }
  return { labels, centroids };
}
