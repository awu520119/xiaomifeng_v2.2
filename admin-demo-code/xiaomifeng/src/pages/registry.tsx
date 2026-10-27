import { AlertOutlined, AppstoreOutlined, SettingOutlined, ToolOutlined } from '@ant-design/icons';
import Solutions from './Solutions';
import { Workbench, Alerts, Tickets, Settings } from './Operations';
export const pageComponents = {
  'ops-home': Workbench,
  'ops-alerts': Alerts,
  'ops-tickets': Tickets,
  'ops-settings': Settings,
  'ops-solutions': Solutions,
};
export const pageIcons = {
  'ops-home': AppstoreOutlined,
  'ops-alerts': AlertOutlined,
  'ops-tickets': ToolOutlined,
  'ops-settings': SettingOutlined,
  'ops-solutions': AppstoreOutlined,
};
