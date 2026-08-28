export type BuilderScope = 'global' | 'plan' | 'template' | 'company' | 'role' | 'user';

export type BuilderMode = 'edit' | 'navigate' | 'preview' | 'test';

export type EditableDevice = 'desktop' | 'tablet' | 'mobile';

export type ProtectionLevel = 'editable' | 'limited' | 'protected' | 'systemCritical';

export type ComponentType = 
  | 'header'
  | 'title'
  | 'subtitle'
  | 'paragraph'
  | 'button'
  | 'input'
  | 'select'
  | 'checkbox'
  | 'card'
  | 'table'
  | 'tabs'
  | 'banner'
  | 'chart'
  | 'stat_card'
  | 'menu_item'
  | 'container'
  | 'divider'
  | 'custom_field'
  | 'badge'
  | 'alert';

export interface ComponentStyles {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: string;
  borderRadius?: string;
  boxShadow?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  display?: string;
  flexDirection?: 'row' | 'column';
  alignItems?: string;
  justifyContent?: string;
  gap?: string;
  opacity?: number;
}

export interface ResponsiveConfig {
  desktop?: Partial<ComponentStyles>;
  tablet?: Partial<ComponentStyles>;
  mobile?: Partial<ComponentStyles>;
  hideOnDesktop?: boolean;
  hideOnTablet?: boolean;
  hideOnMobile?: boolean;
}

export interface ComponentInstance {
  id: string;
  pageId: string;
  parentId?: string;
  componentType: ComponentType;
  componentKey: string;
  name: string;
  order: number;
  content: {
    text?: string;
    label?: string;
    placeholder?: string;
    helpText?: string;
    iconName?: string;
    href?: string;
    badgeText?: string;
    imageUrl?: string;
    options?: string[];
    [key: string]: any;
  };
  styles: ComponentStyles;
  responsive: ResponsiveConfig;
  protectionLevel: ProtectionLevel;
  visibilityRules: {
    roles?: string[];
    companies?: string[];
    plans?: string[];
    minWidthPx?: number;
    hidden?: boolean;
  };
  dataBinding?: {
    dataSource?: string;
    fieldKey?: string;
    filterByCompany?: boolean;
  };
  actionConfig?: {
    type?: 'navigate' | 'open_modal' | 'submit_form' | 'custom_action';
    targetRoute?: string;
    targetModalId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PageConfig {
  id: string;
  name: string;
  slug: string;
  route: string;
  pageType: 'system' | 'custom' | 'portal';
  isSystemPage: boolean;
  scope: BuilderScope;
  companyId?: string;
  components: ComponentInstance[];
  layoutType: 'grid' | 'flex' | 'dashboard' | 'form' | 'table_view';
  requiredPermissions: string[];
  status: 'draft' | 'published' | 'archived';
  version: number;
  updatedAt: string;
  updatedBy: string;
}

export interface PageVersion {
  versionId: string;
  pageId: string;
  versionNumber: number;
  scope: BuilderScope;
  companyId?: string;
  templateId?: string;
  configuration: PageConfig;
  changeSummary: string;
  publishedAt: string;
  publishedBy: string;
  status: 'published' | 'superseded' | 'restored' | 'scheduled';
  scheduledFor?: string;
}

export interface CustomFieldDefinition {
  id: string;
  companyId?: string;
  entityType: 'colaborador' | 'candidato' | 'vaga' | 'empresa' | 'beneficio' | 'documento';
  name: string;
  label: string;
  fieldType: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'file' | 'textarea' | 'currency';
  required: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
  order: number;
  active: boolean;
  createdAt: string;
}

export interface NavigationMenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  parentId?: string;
  order: number;
  roles: string[];
  requiredModule?: string;
  hidden: boolean;
  isCritical?: boolean;
}

export interface ClientTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultTheme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
  menus: NavigationMenuItem[];
  customFields: CustomFieldDefinition[];
  pages: PageConfig[];
  active: boolean;
}

export interface BuilderAuditLog {
  id: string;
  companyId?: string;
  scope: BuilderScope;
  userId: string;
  userName: string;
  action: string;
  pageId?: string;
  componentId?: string;
  description: string;
  beforeSnapshot?: string;
  afterSnapshot?: string;
  createdAt: string;
}

export interface CompanyThemeConfig {
  companyId: string;
  brandingId?: string;
  domain?: string;
  subdomain?: string;
  sslVerified?: boolean;
  companyName?: string;
  slogan?: string;
  logoUrl?: string;
  logoSmallUrl?: string;
  faviconUrl?: string;
  loginBgUrl?: string;
  bannerUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  borderRadius: string;
  fontFamily: string;
  headingFontFamily: string;
  baseFontSize: string;
  sidebarWidth: string;
  headerHeight: string;
  footerText?: string;
  privacyPolicyText?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AiDesignProposal {
  proposalId: string;
  userPrompt: string;
  suggestedChangesSummary: string;
  affectedPageIds: string[];
  themeChanges?: Partial<CompanyThemeConfig>;
  textChanges?: { pageId: string; componentId: string; oldText: string; newText: string }[];
  menuChanges?: { menuId: string; oldLabel: string; newLabel: string }[];
  createdAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface ThemeExportImportFormat {
  version: string;
  exportedAt: string;
  exportedBy: string;
  scope: BuilderScope;
  companyId?: string;
  themeConfig: CompanyThemeConfig;
  menus: NavigationMenuItem[];
  customFields: CustomFieldDefinition[];
  pages: PageConfig[];
}

export interface MasterVisualState {
  activePageId: string;
  builderMode: BuilderMode;
  selectedDevice: EditableDevice;
  zoomLevel: number;
  selectedComponentId?: string;
  selectedCompanyId: string;
  activeScope: BuilderScope;
  activeSubTab: 
    | 'editor'
    | 'menus'
    | 'temas'
    | 'componentes'
    | 'modelos'
    | 'empresas'
    | 'campos'
    | 'versoes'
    | 'publicacoes'
    | 'historico'
    | 'configuracoes'
    | 'auditoria';
  hasUnsavedChanges: boolean;
  lastSavedAt?: string;
}

