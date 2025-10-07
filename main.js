import { createIcons, Users, Package, FileText, PlusCircle, ArrowLeft, Plus, Edit, Trash2, Folder, PackagePlus, Printer } from 'lucide';

// This function is called on multiple pages. We need to check for the existence of icons before rendering.
const iconsToRender = { Users, Package, FileText, PlusCircle, ArrowLeft, Plus, Edit, Trash2, Folder, PackagePlus, Printer };
const existingIconNodes = document.querySelectorAll('[data-lucide]');

if (existingIconNodes.length > 0) {
  createIcons({
    icons: iconsToRender
  });
}
