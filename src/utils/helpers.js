function generateChefId() {
  const prefix = "chef";
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNumber}`;
}

module.exports = { generateChefId };
