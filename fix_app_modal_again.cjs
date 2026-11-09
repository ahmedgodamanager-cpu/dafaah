const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const oldModal = `<AddClientModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        onAddClient={handleAddClient}
        clients={activeClientsList}
      />`;

const newFormStr = `<ClientFormModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        onAddClient={handleAddClient}
        clients={activeClientsList}
      />
      <ClientFormModal
        isOpen={isEditClientOpen}
        onClose={() => setIsEditClientOpen(false)}
        clientToEdit={clientToEditObj}
        onEditClient={handleUpdateClient}
        onAddClient={() => {}} 
        clients={activeClientsList} 
      />`;

if (app.includes(oldModal)) {
  app = app.replace(oldModal, newFormStr);
  fs.writeFileSync('src/App.tsx', app);
  console.log("Replaced successfully.");
} else {
  console.log("Could not find the exact string to replace.");
}

