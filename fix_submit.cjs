const fs = require('fs');
let content = fs.readFileSync('src/components/ClientFormModal.tsx', 'utf8');

const oldSubmit = `    const newClientObj: Client = {
      id: \`cli-\${Date.now()}\`,
      code: code || \`SCHTE\${Math.floor(1000 + Math.random() * 9000)}\`,
      clientName,
      companyName,
      clientNumber,
      groupName: groupName || \`\${clientName} - \${code}\`,
      contract,
      economyFullPackageMonths: contract === 'الاقتصادية' ? economyFullPackageMonths : undefined,
      economyMediaMonths: contract === 'الاقتصادية' ? economyMediaMonths : undefined,
      influencer,
      contractDate,
      startDate,
      durationMonths: effectiveDurationMonths,
      endDate: endDateStr,
      caseStatus,
      holdStartDate: caseStatus === 'hold' ? new Date().toISOString().split('T')[0] : undefined,
      accumulatedHoldDays: 0,
      briefLink,
      whatsappGroupLink,
      driveFolderUrl,
      planLinks,
      themeColor,
      notes,
      isVip,
      isLost: false,
      tasks: defaultTasks,
      createdAt: todayStr,
      updatedAt: todayStr
    };

    onAddClient(newClientObj);
    localStorage.removeItem(DRAFT_KEY);
    onClose();
  };`;

const newSubmit = `    if (clientToEdit && onEditClient) {
      let updatedTasks = clientToEdit.tasks || [];
      if (clientToEdit.startDate && startDate && clientToEdit.startDate !== startDate) {
        const oldStart = new Date(clientToEdit.startDate);
        const newStart = new Date(startDate);
        const diffDays = Math.round((newStart.getTime() - oldStart.getTime()) / (1000 * 3600 * 24));
        
        if (diffDays !== 0) {
          updatedTasks = updatedTasks.map(task => {
            let newTask = { ...task };
            if (task.startDate) {
              const sd = new Date(task.startDate);
              if (!isNaN(sd.getTime())) {
                sd.setDate(sd.getDate() + diffDays);
                newTask.startDate = sd.toISOString().split('T')[0];
              }
            }
            if (task.dueDate) {
              const dd = new Date(task.dueDate);
              if (!isNaN(dd.getTime())) {
                dd.setDate(dd.getDate() + diffDays);
                newTask.dueDate = dd.toISOString().split('T')[0];
              }
            }
            return newTask;
          });
        }
      }

      const todayStr = new Date().toISOString().split('T')[0];
      let finalHoldStartDate = clientToEdit.holdStartDate;
      let finalAccumulatedHoldDays = clientToEdit.accumulatedHoldDays || 0;
      
      if (clientToEdit.caseStatus !== 'hold' && caseStatus === 'hold') {
        finalHoldStartDate = todayStr;
      } else if (clientToEdit.caseStatus === 'hold' && caseStatus !== 'hold') {
        if (clientToEdit.holdStartDate) {
          const holdStart = new Date(clientToEdit.holdStartDate);
          const today = new Date();
          const diffDays = Math.round((today.getTime() - holdStart.getTime()) / (1000 * 3600 * 24));
          if (diffDays > 0) {
            finalAccumulatedHoldDays += diffDays;
            updatedTasks = updatedTasks.map(task => {
              if (task.completed) return task;
              let newTask = { ...task };
              if (task.startDate) {
                const sd = new Date(task.startDate);
                if (!isNaN(sd.getTime())) {
                  sd.setDate(sd.getDate() + diffDays);
                  newTask.startDate = sd.toISOString().split('T')[0];
                }
              }
              if (task.dueDate) {
                const dd = new Date(task.dueDate);
                if (!isNaN(dd.getTime())) {
                  dd.setDate(dd.getDate() + diffDays);
                  newTask.dueDate = dd.toISOString().split('T')[0];
                }
              }
              return newTask;
            });
          }
        }
        finalHoldStartDate = undefined;
      }

      const updatedClient: Client = {
        ...clientToEdit,
        code,
        clientName,
        companyName,
        clientNumber,
        groupName,
        contract,
        economyFullPackageMonths: contract === 'الاقتصادية' ? economyFullPackageMonths : undefined,
        economyMediaMonths: contract === 'الاقتصادية' ? economyMediaMonths : undefined,
        influencer,
        startDate,
        contractDate,
        durationMonths: effectiveDurationMonths,
        endDate: endDateStr,
        caseStatus,
        holdStartDate: finalHoldStartDate,
        accumulatedHoldDays: finalAccumulatedHoldDays,
        briefLink,
        whatsappGroupLink,
        driveFolderUrl,
        planLinks,
        themeColor,
        notes,
        isVip,
        tasks: updatedTasks,
        updatedAt: todayStr
      };
      
      onEditClient(updatedClient);
      onClose();
    } else {
      const newClientObj: Client = {
        id: \`cli-\${Date.now()}\`,
        code: code || \`SCHTE\${Math.floor(1000 + Math.random() * 9000)}\`,
        clientName,
        companyName,
        clientNumber,
        groupName: groupName || \`\${clientName} - \${code}\`,
        contract,
        economyFullPackageMonths: contract === 'الاقتصادية' ? economyFullPackageMonths : undefined,
        economyMediaMonths: contract === 'الاقتصادية' ? economyMediaMonths : undefined,
        influencer,
        contractDate,
        startDate,
        durationMonths: effectiveDurationMonths,
        endDate: endDateStr,
        caseStatus,
        holdStartDate: caseStatus === 'hold' ? new Date().toISOString().split('T')[0] : undefined,
        accumulatedHoldDays: 0,
        briefLink,
        whatsappGroupLink,
        driveFolderUrl,
        planLinks,
        themeColor,
        notes,
        isVip,
        isLost: false,
        tasks: defaultTasks,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };

      onAddClient(newClientObj);
      localStorage.removeItem(DRAFT_KEY);
      onClose();
    }
  };`;

content = content.replace(oldSubmit, newSubmit);
fs.writeFileSync('src/components/ClientFormModal.tsx', content);
