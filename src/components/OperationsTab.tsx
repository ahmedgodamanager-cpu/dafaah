import React from 'react';
import { OperationsView, OperationsViewProps } from './OperationsView';

export interface OperationsTabProps extends OperationsViewProps {}

export const OperationsTab: React.FC<OperationsTabProps> = (props) => {
  return <OperationsView {...props} />;
};

export default OperationsTab;
