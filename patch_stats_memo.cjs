const fs = require('fs');
let content = fs.readFileSync('src/components/StatsOverview.tsx', 'utf8');

// replace the aggregate block
const oldAggregateBlock = `  // Aggregate stats
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.caseStatus === 'نشط').length;
  const holdClients = clients.filter(c => c.caseStatus === 'hold').length;
  const lostClients = clients.filter(c => c.isLost || (c.endDate && getRemainingContractDays(c) < 0)).length;

  let totalTasks = 0;
  let totalCompletedTasks = 0;
  let totalDelayedTasks = 0;
  let totalDueSoonTasks = 0;

  clients.forEach(client => {
    const stats = calculateClientProgress(client);
    totalTasks += stats.totalTasks;
    totalCompletedTasks += stats.completedTasks;
    totalDelayedTasks += stats.delayedTasks;
    totalDueSoonTasks += stats.dueSoonTasks;
    
  });

  // Calculate clients in their first 40 days
  const first40DaysClients = clients.filter(c => {
    const elapsedContractDaysSinceStart = c.startDate ? -getDaysDifference(c.startDate) : -1;
    return elapsedContractDaysSinceStart >= 0 && elapsedContractDaysSinceStart <= 40;
  });

  const overallProgressPercent = totalTasks > 0 ? Math.round((totalCompletedTasks / totalTasks) * 100) : 0;

  // Contract list options
  const contractTypes = Array.from(new Set(clients.map(c => c.contract).filter(Boolean)));
  const statusTypes = ['نشط', 'hold', 'مكتمل', 'جديد', 'قيد المراجعة', 'مؤجل'];`;

const newAggregateBlock = `  // Aggregate stats
  const {
    totalClients,
    activeClients,
    holdClients,
    lostClients,
    totalTasks,
    totalCompletedTasks,
    totalDelayedTasks,
    totalDueSoonTasks,
    first40DaysClients,
    overallProgressPercent,
    contractTypes
  } = React.useMemo(() => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.caseStatus === 'نشط').length;
    const holdClients = clients.filter(c => c.caseStatus === 'hold').length;
    const lostClients = clients.filter(c => c.isLost || (c.endDate && getRemainingContractDays(c) < 0)).length;

    let totalTasks = 0;
    let totalCompletedTasks = 0;
    let totalDelayedTasks = 0;
    let totalDueSoonTasks = 0;

    clients.forEach(client => {
      const stats = calculateClientProgress(client);
      totalTasks += stats.totalTasks;
      totalCompletedTasks += stats.completedTasks;
      totalDelayedTasks += stats.delayedTasks;
      totalDueSoonTasks += stats.dueSoonTasks;
    });

    const first40DaysClients = clients.filter(c => {
      const elapsedContractDaysSinceStart = c.startDate ? -getDaysDifference(c.startDate) : -1;
      return elapsedContractDaysSinceStart >= 0 && elapsedContractDaysSinceStart <= 40;
    });

    const overallProgressPercent = totalTasks > 0 ? Math.round((totalCompletedTasks / totalTasks) * 100) : 0;
    const contractTypes = Array.from(new Set(clients.map(c => c.contract).filter(Boolean)));

    return {
      totalClients,
      activeClients,
      holdClients,
      lostClients,
      totalTasks,
      totalCompletedTasks,
      totalDelayedTasks,
      totalDueSoonTasks,
      first40DaysClients,
      overallProgressPercent,
      contractTypes
    };
  }, [clients]);

  const statusTypes = React.useMemo(() => ['نشط', 'hold', 'مكتمل', 'جديد', 'قيد المراجعة', 'مؤجل'], []);`;

if (content.includes("const totalClients = clients.length;")) {
  content = content.replace(oldAggregateBlock, newAggregateBlock);
  fs.writeFileSync('src/components/StatsOverview.tsx', content);
  console.log("StatsOverview patched successfully.");
} else {
  console.log("Could not find block in StatsOverview.");
}
