const fs = require('fs');
let code = fs.readFileSync('src/hooks/useFirestoreData.ts', 'utf8');

const batchLogic = `  // Batching state updates to prevent massive re-renders
  const pendingUpdatesRef = useRef<Array<(curr: Record<string, Client>) => Record<string, Client>>>([]);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const batchUpdateClientsMap = (updater: (curr: Record<string, Client>) => Record<string, Client>) => {
    pendingUpdatesRef.current.push(updater);
    if (!updateTimeoutRef.current) {
      updateTimeoutRef.current = setTimeout(() => {
        setClientsMap((curr) => {
          let next = curr;
          pendingUpdatesRef.current.forEach(fn => {
            next = fn(next);
          });
          pendingUpdatesRef.current = [];
          return next;
        });
        updateTimeoutRef.current = null;
      }, 150);
    }
  };

  useEffect(() => {`;

code = code.replace('  useEffect(() => {', batchLogic);
code = code.replace(/setClientsMap\(prev => {/g, 'batchUpdateClientsMap(prev => {');
code = code.replace(/setClientsMap\(curr => {/g, 'batchUpdateClientsMap(curr => {');

fs.writeFileSync('src/hooks/useFirestoreData.ts', code);
