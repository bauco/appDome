import { Component , HostListener, Input, OnInit} from '@angular/core' ;
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'app/MenuItem';
import { TreeNodeComponent } from 'app/tree-node/tree-node.component';

@Component({
  selector: 'app-tree-select',
  standalone: true,
  imports: [FormsModule,TreeNodeComponent],
  templateUrl: './tree-select.component.html',
  styleUrl: './tree-select.component.scss'
})
export class TreeSelectComponent implements OnInit{
  isDropdownOpen: boolean = false;
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  getLabelSummary(): string {
    return this.selectedData.map(item => item.label).join(', ');
  }
  @Input() treeData: MenuItem[] = [];
  originalTreeData: MenuItem[] = [];  // Backup of the original tree data
  selectedData : MenuItem[] = [];
  searchQuery = '';

  ngOnInit(): void {
    this.originalTreeData = JSON.parse(JSON.stringify(this.treeData));
  }

  copyTreeData(originalData: MenuItem[]): MenuItem[] {
    return originalData.map(node => ({
      ...node,
      children: node.children ? this.copyTreeData(node.children) : undefined,
    }));
  }

  filterTree(searchQuery: string) {
    this.treeData = this.copyTreeData(this.originalTreeData);
    const search = searchQuery.toLowerCase();
    function recursiveFilter(nodes: MenuItem[]): MenuItem[] {
      return nodes
        .map(node => {
          const match = node.label.toLowerCase().includes(search);
          const filteredChildren = node.children ? recursiveFilter(node.children) : [];
          return match || filteredChildren.length ? { ...node, children: filteredChildren } : null;
        })
        .filter(node => node !== null) as MenuItem[];
    }
    this.treeData = recursiveFilter(this.treeData.slice());
  }

  clearSearch() {
    this.searchQuery = '';
    this.treeData = this.originalTreeData.slice();
  }


  nodeTreeDataChange(nodes: MenuItem[]) {
    const selectedNodes: MenuItem[] = [];
    const updateNodes = (sourceNodes: MenuItem[], updatedNodes: MenuItem[]) => {
      updatedNodes.forEach(updatedNode => {
        // Find the matching node in sourceNodes by `identifier`
        const matchingNode = sourceNodes.find(node => node.identifier === updatedNode.identifier);
  
        if (matchingNode) {
          // Update `selected` and `expanded` properties on the matching node
          matchingNode.selected = updatedNode.selected;
          matchingNode.expanded = updatedNode.expanded;
          
          if(matchingNode.selected){
            selectedNodes.push(matchingNode);
          }
          // If there are children, recursively update them as well
          if (matchingNode.children && updatedNode.children) {
            updateNodes(matchingNode.children, updatedNode.children);
          }
        }
      });
    };
  
    // Start the update process from the root level
    updateNodes(this.originalTreeData, nodes);
    this.selectedData = selectedNodes;
  }
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const targetElement = event.target as HTMLElement;
    const   
   isClickInsideDropdown = targetElement.closest('.dropdown');
    if (!isClickInsideDropdown) {
      this.isDropdownOpen = false;
    }
  }
}
