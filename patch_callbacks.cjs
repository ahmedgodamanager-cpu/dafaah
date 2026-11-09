const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/onSelectClient=\{\(cId\) => setSelectedClientId\(cId\)\}/g, "onSelectClient={setSelectedClientId}");
content = content.replace(/onSelect=\{\(id\) => setSelectedClientId\(id\)\}/g, "onSelect={setSelectedClientId}");
content = content.replace(/onSelect=\{\(cId\) => setSelectedClientId\(cId\)\}/g, "onSelect={setSelectedClientId}");
content = content.replace(/onEdit=\{\(client\) => \{[^}]*setEditingClient\(client\);[^}]*setIsFormOpen\(true\);[^}]*\}\}/g, "onEdit={handleEditClient}");

// Create handleEditClient if not exists
if (!content.includes("const handleEditClient = useCallback")) {
    const hookInsertionPoint = "const handleAddTask = async (clientId: string, newTask: TaskItem) => {";
    content = content.replace(hookInsertionPoint, `
  const handleEditClient = React.useCallback((client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  }, []);
  
  const handleArchiveToggle = React.useCallback(async (client: Client) => {
    try {
      await updateClient(client.id, { isArchived: !client.isArchived });
      toast.success(client.isArchived ? 'تم استعادة العميل بنجاح' : 'تم أرشفة العميل بنجاح');
    } catch (error) {
      toast.error('حدث خطأ أثناء أرشفة العميل');
    }
  }, [updateClient]);

  const handleDeleteClientCallback = React.useCallback(async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل نهائياً؟')) {
      try {
        await deleteClient(id);
        toast.success('تم حذف العميل بنجاح');
      } catch (error) {
        toast.error('حدث خطأ أثناء الحذف');
      }
    }
  }, [deleteClient]);
  
  ${hookInsertionPoint}`);
}

// Replace more inline callbacks
content = content.replace(/onEdit=\{\(client\) => \{\s*setEditingClient\(client\);\s*setIsFormOpen\(true\);\s*\}\}/g, "onEdit={handleEditClient}");
content = content.replace(/onArchiveToggle=\{\(client\) => \{\s*updateClient\(client\.id, \{ isArchived: !client\.isArchived \}\);\s*\}\}/g, "onArchiveToggle={handleArchiveToggle}");
content = content.replace(/onDelete=\{\(id\) => \{\s*if \(window\.confirm\('هل أنت متأكد من حذف هذا العميل نهائياً؟'\)\) \{\s*deleteClient\(id\);\s*\}\s*\}\}/g, "onDelete={handleDeleteClientCallback}");
// also replace inline handleAddTask
content = content.replace(/onAddTask=\{\(id\) => \{\s*setAddTaskClientId\(id\);\s*setIsAddTaskOpen\(true\);\s*\}\}/g, "onAddTask={handleOpenAddTask}");

if (!content.includes("const handleOpenAddTask = React.useCallback")) {
   const hookInsertionPoint2 = "const handleEditClient = React.useCallback";
   content = content.replace(hookInsertionPoint2, `
  const handleOpenAddTask = React.useCallback((id: string) => {
    setAddTaskClientId(id);
    setIsAddTaskOpen(true);
  }, []);
  
  ${hookInsertionPoint2}`);
}

fs.writeFileSync('src/App.tsx', content);
