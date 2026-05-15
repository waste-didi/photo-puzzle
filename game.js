const photoInput = document.querySelector("#photoInput");
const uploadPanel = document.querySelector("#uploadPanel");
const uploadTarget = document.querySelector(".upload-target");
const boardWrap = document.querySelector("#boardWrap");
const board = document.querySelector("#board");
const movesEl = document.querySelector("#moves");
const timerEl = document.querySelector("#timer");
const difficultySelect = document.querySelector("#difficulty");
const shuffleButton = document.querySelector("#shuffleButton");
const previewButton = document.querySelector("#previewButton");
const previewDialog = document.querySelector("#previewDialog");
const closePreviewButton = document.querySelector("#closePreviewButton");
const previewImage = document.querySelector("#previewImage");
const winCard = document.querySelector("#winCard");
const winStats = document.querySelector("#winStats");

let imageUrl = "";
let puzzleImageUrl = "";
let size = Number(difficultySelect.value);
let order = [];
let selectedIndex = null;
let moves = 0;
let startedAt = 0;
let timerId = 0;
let solved = false;

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateTimer() {
  if (!startedAt || solved) return;
  timerEl.textContent = formatTime(Math.floor((Date.now() - startedAt) / 1000));
}

function startTimer() {
  clearInterval(timerId);
  startedAt = Date.now();
  timerEl.textContent = "00:00";
  timerId = setInterval(updateTimer, 1000);
}

function getAdjacentIndexes(index) {
  const row = Math.floor(index / size);
  const col = index % size;
  const indexes = [];

  if (row > 0) indexes.push(index - size);
  if (row < size - 1) indexes.push(index + size);
  if (col > 0) indexes.push(index - 1);
  if (col < size - 1) indexes.push(index + 1);

  return indexes;
}

function makeShuffledOrder(tileCount) {
  const solvedOrder = Array.from({ length: tileCount }, (_, index) => index);
  const shuffled = [...solvedOrder];
  const shuffleMoves = tileCount * size * 8;

  for (let step = 0; step < shuffleMoves; step += 1) {
    const firstIndex = Math.floor(Math.random() * tileCount);
    const adjacentIndexes = getAdjacentIndexes(firstIndex);
    const secondIndex = adjacentIndexes[Math.floor(Math.random() * adjacentIndexes.length)];
    [shuffled[firstIndex], shuffled[secondIndex]] = [shuffled[secondIndex], shuffled[firstIndex]];
  }

  return shuffled.every((value, index) => value === index)
    ? makeShuffledOrder(tileCount)
    : shuffled;
}

function resetStats() {
  selectedIndex = null;
  moves = 0;
  solved = false;
  movesEl.textContent = "0";
  winCard.classList.add("is-hidden");
  startTimer();
}

function renderBoard() {
  board.innerHTML = "";
  board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  board.style.setProperty("--image-size", `${size * 100}%`);

  order.forEach((sourceIndex, currentIndex) => {
    const tile = document.createElement("button");
    const sourceRow = Math.floor(sourceIndex / size);
    const sourceCol = sourceIndex % size;

    tile.className = "tile";
    tile.type = "button";
    tile.dataset.index = String(currentIndex);
    tile.ariaLabel = `拼图块 ${currentIndex + 1}`;
    tile.style.backgroundImage = `url("${puzzleImageUrl}")`;
    tile.style.backgroundPosition = `${(sourceCol / (size - 1)) * 100}% ${(sourceRow / (size - 1)) * 100}%`;

    if (sourceIndex === currentIndex) {
      tile.classList.add("is-correct");
    }

    tile.addEventListener("click", () => selectTile(currentIndex));
    board.append(tile);
  });
}

function buildSquarePuzzleImage(sourceUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const side = Math.min(1200, Math.max(600, Math.min(image.naturalWidth, image.naturalHeight)));
      const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
      const sourceX = (image.naturalWidth - sourceSize) / 2;
      const sourceY = (image.naturalHeight - sourceSize) / 2;
      const context = canvas.getContext("2d");

      canvas.width = side;
      canvas.height = side;
      context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, side, side);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Unable to prepare puzzle image."));
          return;
        }

        resolve(URL.createObjectURL(blob));
      }, "image/jpeg", 0.9);
    };
    image.onerror = () => reject(new Error("Unable to load selected image."));
    image.src = sourceUrl;
  });
}

function swapTiles(firstIndex, secondIndex) {
  [order[firstIndex], order[secondIndex]] = [order[secondIndex], order[firstIndex]];
  moves += 1;
  movesEl.textContent = String(moves);
  selectedIndex = null;
  renderBoard();
  checkWin();
}

function areAdjacent(firstIndex, secondIndex) {
  const firstRow = Math.floor(firstIndex / size);
  const firstCol = firstIndex % size;
  const secondRow = Math.floor(secondIndex / size);
  const secondCol = secondIndex % size;
  const distance = Math.abs(firstRow - secondRow) + Math.abs(firstCol - secondCol);

  return distance === 1;
}

function selectTile(index) {
  if (!imageUrl || solved) return;

  if (selectedIndex === null) {
    selectedIndex = index;
    board.children[index].classList.add("is-selected");
    return;
  }

  if (selectedIndex === index) {
    selectedIndex = null;
    renderBoard();
    return;
  }

  if (!areAdjacent(selectedIndex, index)) {
    selectedIndex = index;
    renderBoard();
    board.children[index].classList.add("is-selected");
    return;
  }

  swapTiles(selectedIndex, index);
}

function checkWin() {
  if (!order.every((value, index) => value === index)) return;

  solved = true;
  updateTimer();
  clearInterval(timerId);
  const elapsed = timerEl.textContent;
  winStats.textContent = `${moves} 步 · ${elapsed}`;
  winCard.classList.remove("is-hidden");
}

function startGame() {
  if (!imageUrl) return;

  size = Number(difficultySelect.value);
  order = makeShuffledOrder(size * size);
  uploadPanel.classList.add("is-hidden");
  boardWrap.classList.remove("is-hidden");
  resetStats();
  renderBoard();
}

async function loadPhotoFile(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) return;

  if (imageUrl) {
    URL.revokeObjectURL(imageUrl);
  }
  if (puzzleImageUrl) {
    URL.revokeObjectURL(puzzleImageUrl);
  }

  imageUrl = URL.createObjectURL(file);
  previewImage.src = imageUrl;

  try {
    puzzleImageUrl = await buildSquarePuzzleImage(imageUrl);
    startGame();
  } catch (error) {
    console.error(error);
    puzzleImageUrl = imageUrl;
    startGame();
  }
}

photoInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  loadPhotoFile(file);
});

uploadTarget.addEventListener("dragenter", (event) => {
  event.preventDefault();
  uploadTarget.classList.add("is-dragging");
});

uploadTarget.addEventListener("dragover", (event) => {
  event.preventDefault();
});

uploadTarget.addEventListener("dragleave", (event) => {
  if (!uploadTarget.contains(event.relatedTarget)) {
    uploadTarget.classList.remove("is-dragging");
  }
});

uploadTarget.addEventListener("drop", (event) => {
  event.preventDefault();
  uploadTarget.classList.remove("is-dragging");
  const [file] = event.dataTransfer.files;
  loadPhotoFile(file);
});

difficultySelect.addEventListener("change", startGame);
shuffleButton.addEventListener("click", startGame);

previewButton.addEventListener("click", () => {
  if (!imageUrl) {
    photoInput.click();
    return;
  }

  previewDialog.showModal();
});

closePreviewButton.addEventListener("click", () => {
  previewDialog.close();
});

previewDialog.addEventListener("click", (event) => {
  if (event.target === previewDialog) {
    previewDialog.close();
  }
});
