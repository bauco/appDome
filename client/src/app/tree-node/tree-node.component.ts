import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'app/MenuItem';

@Component({
  selector: 'app-tree-node',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './tree-node.component.html',
  styleUrl: './tree-node.component.scss'
})
export class TreeNodeComponent {


  @Input() nodeData: MenuItem[] = [];
  @Output() nodeDataChange = new EventEmitter<MenuItem[]>();

  toggleNode(node: MenuItem) {
    node.expanded = !node.expanded;
    let tmpNOde = this.nodeData.find(tmpNode => tmpNode.identifier === node.identifier)
    tmpNOde = node;
    if(tmpNOde){
      this.nodeDataChange.emit([...this.nodeData]);
    }
  }
  toggleSelect(node: MenuItem) {
    this.setChildrenSelected(node, node.selected ?? false);
    this.updateNodeData();
  }

  setChildrenSelected(node: MenuItem, selected: boolean) {
    if (node.children) {
      node.expanded =true
      node.children.forEach(child => {
        child.selected = selected;
        this.setChildrenSelected(child, selected);
      });
    }
  }

  nodeChildDataChange(node: MenuItem) {
    if (node.children) {
      if(node.children.every(child => child.selected === true)){
        node.selected = true;
      } else {
        node.selected = false;
      }
      this.updateNodeData();
    }
  }
  
  updateNodeData() {
    this.nodeDataChange.emit([...this.nodeData]);
  }

  allSelected(node: MenuItem) {
    if(node.selected || node.children?.find(child => child.selected)){
      if (node.children && node.children.length) {
        return !node.children.every(child => child.selected);
      }
    }
    return false;
  }
}
