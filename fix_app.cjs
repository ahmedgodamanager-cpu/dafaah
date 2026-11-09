const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
`  const handleEditClient = React.useCallback((client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  }, []);`,
`  const handleEditClient = React.useCallback((client: Client) => {
    setEditingClient(client);
  }, []);`
);

// Remove the second handleArchiveToggle (the old one was async without useCallback)
// We have two now. Let's find the original one and remove it.
const oldArchiveFunction = `  const handleArchiveToggle = async (client: Client) => {
    try {
      await updateClient({ ...client, isArchived: !client.isArchived });
      toast.success(client.isArchived ? 'تم استعادة العميل من الأرشيف' : 'تم أرشفة العميل بنجاح');
    } catch(err) {
      toast.error('حدث خطأ أثناء تحديث حالة الأرشيف');
    }
  };`;
content = content.replace(oldArchiveFunction, "");

fs.writeFileSync('src/App.tsx', content);
