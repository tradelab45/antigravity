const fs = require('fs');
let modal = fs.readFileSync('src/components/StockDetailModal.tsx', 'utf8');
modal = modal.replace(
  "import { PlayCircle, SkipForward, FastForward, CheckSquare, XSquare, Target, Check, Bell, Star } from 'lucide-react';",
  "import { PlayCircle, SkipForward, FastForward, CheckSquare, XSquare, Target, Check, Bell, Star, Calendar, Coins, TrendingUp } from 'lucide-react';"
);
// It might be split across lines, so let's do a more robust regex if the above fails.
if (!modal.includes('Calendar, Coins')) {
  modal = modal.replace(
    /import \{[^}]*Star[^}]*\} from 'lucide-react';/g,
    match => match.replace('Star', 'Star, Calendar, Coins, TrendingUp')
  );
}
fs.writeFileSync('src/components/StockDetailModal.tsx', modal);
