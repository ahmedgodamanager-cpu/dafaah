const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const fabricated = `      <ClientFormModal
        isOpen={isEditClientOpen}
        onClose={() => setIsEditClientOpen(false)}
        clientToEdit={clientToEditObj}
        onEditClient={handleUpdateClient}
        onAddClient={() => {}} 
        clients={activeClientsList} 
      />`;

content = content.replace(fabricated, "");

const oldEdit = `      <EditClientModal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        client={editingClient}
        onSaveClient={handleUpdateClient}
      />`;

const newEdit = `      <ClientFormModal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        clientToEdit={editingClient}
        onEditClient={handleUpdateClient}
        onAddClient={() => {}} 
        clients={activeClientsList} 
      />`;

content = content.replace(oldEdit, newEdit);
fs.writeFileSync('src/App.tsx', content);
