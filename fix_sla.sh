head -n 40 src/components/SlaDashboardView.tsx > tmp_sla.tsx
cat << 'INNER_EOF' >> tmp_sla.tsx
  const [deptModalState, setDeptModalState] = useState<{isOpen: boolean, type: 'completed' | 'delayed' | 'upcoming', categoryId: string}>({
    isOpen: false,
    type: 'completed',
    categoryId: ''
  });

INNER_EOF
tail -n +41 src/components/SlaDashboardView.tsx >> tmp_sla.tsx
mv tmp_sla.tsx src/components/SlaDashboardView.tsx
