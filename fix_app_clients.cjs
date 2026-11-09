const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace("import { AddClientModal } from './components/AddClientModal';", "import { ClientFormModal } from './components/ClientFormModal';");
app = app.replace("import { EditClientModal } from './components/EditClientModal';\n", "");

const addModalStr = `<AddClientModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        onAddClient={handleAddClient}
        clients={clients}
      />`;

const editModalStr = `<EditClientModal
        isOpen={isEditClientOpen}
        onClose={() => setIsEditClientOpen(false)}
        client={clientToEditObj}
        onSaveClient={handleUpdateClient}
      />`;

const newFormStr = `<ClientFormModal
        isOpen={isAddClientOpen}
        onClose={() => setIsAddClientOpen(false)}
        onAddClient={handleAddClient}
        clients={clients}
      />
      <ClientFormModal
        isOpen={isEditClientOpen}
        onClose={() => setIsEditClientOpen(false)}
        clientToEdit={clientToEditObj}
        onEditClient={handleUpdateClient}
        onAddClient={() => {}} 
        clients={clients} 
      />`;

app = app.replace(addModalStr, newFormStr);
app = app.replace(editModalStr, "");

fs.writeFileSync('src/App.tsx', app);
