const fs = require('fs');
let ctx = fs.readFileSync('src/context/SimulatorContext.tsx', 'utf8');

ctx = ctx.replace(
  'const [copilotFeedback,\n        stockNotes,\n        updateStockNote, setCopilotFeedback]',
  'const [copilotFeedback, setCopilotFeedback]'
);

ctx = ctx.replace(
  'copilotFeedback,\n        stockNotes,\n        updateStockNote,\n        clearCopilotFeedback,',
  'copilotFeedback,\n        clearCopilotFeedback,'
);

// We still need to export stockNotes from the context!
// Let's add it before clearCopilotFeedback
ctx = ctx.replace(
  'copilotFeedback,\n        clearCopilotFeedback,',
  'copilotFeedback,\n        clearCopilotFeedback,\n        stockNotes,\n        updateStockNote,'
);

fs.writeFileSync('src/context/SimulatorContext.tsx', ctx);
