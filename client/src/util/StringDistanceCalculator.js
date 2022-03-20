class StringDistanceCalculator {
  constructor() {
    this.editTypes = { insertion: "I", deletion: "D", substitution: "S" };
  }

  // Levenshtein edited to work on sentence broken into words instead of strings.
  computeDistance(words1, words2) {
    const matrix = [];
    const paths = [];

    for (let i = 0; i <= words1.length; i++) {
      matrix[i] = [i];
      paths[i] = [[i - 1, 0]];
    }

    for (let j = 0; j <= words2.length; j++) {
      matrix[0][j] = j;
      paths[0][j] = [0, j - 1];
    }

    for (let i = 1; i <= words1.length; i++) {
          for (let j = 1; j <= words2.length; j++) {

          if (words1[i - 1] === words2[j - 1]) {
            matrix[i][j] = matrix[i - 1][j - 1];
            paths[i][j] = [i - 1, j - 1];
          } else {
            const min = Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
            
            matrix[i][j] = min + 1;
            
            if (matrix[i - 1][j] === min) {
              paths[i][j] = [i - 1, j];
            } else if (matrix[i][j - 1] === min) {
              paths[i][j] = [i, j - 1];
            } else if (matrix[i - 1][j - 1] === min) {
              paths[i][j] = [i - 1, j - 1];
            }
          }
        }
    }

  let levenPath = [];
	let j = words2.length;
	for (let i = words1.length; i >= 0 && j >= 0; ) {
		for (j = words2.length; i >= 0 && j >= 0; ) {
			levenPath.push({ i, j });
			let t = i;
			i = paths[i][j][0];
			j = paths[t][j][1];
		}
  }

	levenPath = levenPath.reverse();

	for (let i = 0; i < levenPath.length; i++) {
		const last = levenPath[i - 1], cur = levenPath[i];
		if (i !== 0) {
			if (
				cur.i === last.i + 1 &&
				cur.j === last.j + 1 &&
				matrix[cur.i][cur.j] !== matrix[last.i][last.j]
			)
				cur.type = this.editTypes.substitution;
			else if (cur.i === last.i && cur.j === last.j + 1)
				cur.type = this.editTypes.insertion;
			else if (cur.i === last.i + 1 && cur.j === last.j)
				cur.type = this.editTypes.deletion;
		}
	}

	return { matrix: matrix, levenPath: levenPath };
  }
}

export default new StringDistanceCalculator();