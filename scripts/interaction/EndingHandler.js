async function endSection() {
  alert("桥段已超出20轮，自动结算结果。");
  disableInput();
  const summary = await getSectionSummary(currentSection.id, gameManager.getMainPlayerHistory(), currentSection);
  await handleOutcome(currentSection.id, summary, currentSection, currentIsReplay);
}

async function handleSectionEnd() {
  disableInput();
  const summary = await getSectionSummary(currentSection.id, gameManager.getMainPlayerHistory(), currentSection);
  await handleOutcome(currentSection.id, summary, currentSection, currentIsReplay);
}