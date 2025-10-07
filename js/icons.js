import {
  createIcons,
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

/**
 * Renders all icons with the `data-lucide` attribute on the page.
 *
 * This function explicitly imports each icon needed by the application and
 * passes them to `createIcons`. This is the most robust method to prevent
 * build tools from mistakenly removing the icons (tree-shaking) during
 * the production build process.
 */
export const renderIcons = () => {
  createIcons({
    icons: {
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
    }
  });
};
