const fs = require('fs');
let content = fs.readFileSync('src/components/ClientTasksSection.tsx', 'utf8');

content = content.replace(
  "import { formatDateArabic, getTaskTimeStatus } from '../utils/dateUtils';",
  "import { formatDateArabic, getTaskTimeStatus, calculateClientProgress, getWhatsAppLink, getRemainingContractDays } from '../utils/dateUtils';"
);

content = content.replace(
  "import { Plus, GripVertical, CheckCircle2, Clock, MapPin, AlertTriangle, MessageSquare, StickyNote, Trash2, Edit3, X, Save, FileText, Share2, Briefcase, Calendar, CheckSquare, Search, Smartphone, Users, ChevronDown, ChevronUp, Copy } from 'lucide-react';",
  "import { Plus, GripVertical, CheckCircle2, Clock, MapPin, AlertTriangle, MessageSquare, StickyNote, Trash2, Edit3, X, Save, FileText, Share2, Briefcase, Calendar, CheckSquare, Search, Smartphone, Users, ChevronDown, ChevronUp, Copy, Key, Palette, Video, Globe, CalendarCheck, Activity, Info } from 'lucide-react';"
);

// also fix onOpenEditClient error
// src/components/ClientTasksSection.tsx(159,9): error TS2304: Cannot find name 'onOpenEditClient'.
// Let's add it to props
content = content.replace(
  "  onOpenAddTask: (clientId: string) => void;",
  "  onOpenAddTask: (clientId: string) => void;\n  onOpenEditClient: (client: Client) => void;"
);

content = content.replace(
  "  onOpenAddTask,\n  setConfirmModalConfig\n}) => {",
  "  onOpenAddTask,\n  onOpenEditClient,\n  setConfirmModalConfig\n}) => {"
);

fs.writeFileSync('src/components/ClientTasksSection.tsx', content);
