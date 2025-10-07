// js/icon-list.js

/**
 * This file acts as a catalog of all icons used in the application.
 * By exporting them from a single module, we can import them with `import * as ...`,
 * which is a strong signal to bundlers like Vite to prevent tree-shaking
 * and ensure all icons are available in the final build.
 */
export {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Users,
  Package,
  FileText,
  PlusCircle,
  Folder,
  PackagePlus,
  Printer,
  ClipboardList
} from 'lucide';
