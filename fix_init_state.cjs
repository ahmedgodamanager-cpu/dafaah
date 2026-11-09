const fs = require('fs');
let content = fs.readFileSync('src/components/ClientFormModal.tsx', 'utf8');

// The effect that loads the draft:
/*
  useEffect(() => {
    if (isOpen) {
      // Load draft from localStorage
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
*/

const oldEffect = `  useEffect(() => {
    if (isOpen) {
      // Load draft from localStorage
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.code) setCode(draft.code);
          if (draft.clientName) setClientName(draft.clientName);
          if (draft.companyName) setCompanyName(draft.companyName);
          if (draft.clientNumber) setClientNumber(draft.clientNumber);
          if (draft.groupName) setGroupName(draft.groupName);
          if (draft.isVip !== undefined) setIsVip(draft.isVip);
          if (draft.contract) setContract(draft.contract);
          if (draft.economyFullPackageMonths !== undefined) setEconomyFullPackageMonths(draft.economyFullPackageMonths);
          if (draft.economyMediaMonths !== undefined) setEconomyMediaMonths(draft.economyMediaMonths);
          if (draft.influencer) setInfluencer(draft.influencer);
          if (draft.startDate) setStartDate(draft.startDate);
          if (draft.contractDate) setContractDate(draft.contractDate);
          if (draft.durationMonths) setDurationMonths(draft.durationMonths);
          if (draft.caseStatus) setCaseStatus(draft.caseStatus);
          if (draft.briefLink) setBriefLink(draft.briefLink);
          if (draft.whatsappGroupLink) setWhatsappGroupLink(draft.whatsappGroupLink);
          if (draft.driveFolderUrl) setDriveFolderUrl(draft.driveFolderUrl);
          if (draft.planLinks) setPlanLinks(draft.planLinks);
          if (draft.themeColor) setThemeColor(draft.themeColor);
          if (draft.notes) setNotes(draft.notes);
          if (draft.autoAddDefaultTasks !== undefined) setAutoAddDefaultTasks(draft.autoAddDefaultTasks);
        } catch (e) {
          console.error('Failed to parse draft', e);
        }
      }
    } else {
      // Save draft when closing (if not submitted)
      const draft = {
        code, clientName, companyName, clientNumber, groupName, isVip,
        contract, contractDate, economyFullPackageMonths, economyMediaMonths, influencer, startDate, durationMonths, caseStatus,
        briefLink, whatsappGroupLink, driveFolderUrl, planLinks,
        themeColor, notes, autoAddDefaultTasks
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [isOpen, code, clientName, companyName, clientNumber, groupName, isVip, contract, economyFullPackageMonths, economyMediaMonths, influencer, startDate, durationMonths, caseStatus, briefLink, whatsappGroupLink, driveFolderUrl, planLinks, themeColor, notes, autoAddDefaultTasks]);`;

const newEffect = `  useEffect(() => {
    if (isOpen) {
      if (clientToEdit) {
        setCode(clientToEdit.code);
        setClientName(clientToEdit.clientName);
        setCompanyName(clientToEdit.companyName);
        setClientNumber(clientToEdit.clientNumber || '');
        setGroupName(clientToEdit.groupName || '');
        setIsVip(clientToEdit.isVip || false);
        setContract(clientToEdit.contract);
        setEconomyFullPackageMonths(clientToEdit.economyFullPackageMonths || 1);
        setEconomyMediaMonths(clientToEdit.economyMediaMonths || 2);
        setInfluencer(clientToEdit.influencer || '');
        setStartDate(clientToEdit.startDate);
        setContractDate(clientToEdit.contractDate || clientToEdit.startDate);
        setDurationMonths(clientToEdit.durationMonths);
        setCaseStatus(clientToEdit.caseStatus);
        setBriefLink(clientToEdit.briefLink || '');
        setWhatsappGroupLink(clientToEdit.whatsappGroupLink || '');
        setDriveFolderUrl(clientToEdit.driveFolderUrl || '');
        setPlanLinks(clientToEdit.planLinks || []);
        setThemeColor(clientToEdit.themeColor || 'slate');
        setNotes(clientToEdit.notes || '');
        setAutoAddDefaultTasks(false); // No tasks auto-add in edit mode
      } else {
        // Load draft from localStorage
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
          try {
            const draft = JSON.parse(savedDraft);
            if (draft.code) setCode(draft.code);
            if (draft.clientName) setClientName(draft.clientName);
            if (draft.companyName) setCompanyName(draft.companyName);
            if (draft.clientNumber) setClientNumber(draft.clientNumber);
            if (draft.groupName) setGroupName(draft.groupName);
            if (draft.isVip !== undefined) setIsVip(draft.isVip);
            if (draft.contract) setContract(draft.contract);
            if (draft.economyFullPackageMonths !== undefined) setEconomyFullPackageMonths(draft.economyFullPackageMonths);
            if (draft.economyMediaMonths !== undefined) setEconomyMediaMonths(draft.economyMediaMonths);
            if (draft.influencer) setInfluencer(draft.influencer);
            if (draft.startDate) setStartDate(draft.startDate);
            if (draft.contractDate) setContractDate(draft.contractDate);
            if (draft.durationMonths) setDurationMonths(draft.durationMonths);
            if (draft.caseStatus) setCaseStatus(draft.caseStatus);
            if (draft.briefLink) setBriefLink(draft.briefLink);
            if (draft.whatsappGroupLink) setWhatsappGroupLink(draft.whatsappGroupLink);
            if (draft.driveFolderUrl) setDriveFolderUrl(draft.driveFolderUrl);
            if (draft.planLinks) setPlanLinks(draft.planLinks);
            if (draft.themeColor) setThemeColor(draft.themeColor);
            if (draft.notes) setNotes(draft.notes);
            if (draft.autoAddDefaultTasks !== undefined) setAutoAddDefaultTasks(draft.autoAddDefaultTasks);
          } catch (e) {
            console.error('Failed to parse draft', e);
          }
        }
      }
    } else if (!clientToEdit) {
      // Save draft when closing (if not submitted) only for add mode
      const draft = {
        code, clientName, companyName, clientNumber, groupName, isVip,
        contract, contractDate, economyFullPackageMonths, economyMediaMonths, influencer, startDate, durationMonths, caseStatus,
        briefLink, whatsappGroupLink, driveFolderUrl, planLinks,
        themeColor, notes, autoAddDefaultTasks
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [isOpen, clientToEdit]);`;

content = content.replace(oldEffect, newEffect);
fs.writeFileSync('src/components/ClientFormModal.tsx', content);
