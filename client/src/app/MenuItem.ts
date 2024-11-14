export interface IMenuItem{
   identifier: string,
   label: string,
   iconName: string,
   iconFill?:boolean,
   route?: string,
   children?: MenuItem[],
   childMenu?: string,
   selected?: boolean,
   expanded?: boolean,
   visbility?: boolean
}
export class MenuItem implements IMenuItem{
  identifier: string;
  label: string;
  iconName: string;
  iconFill?:boolean;
  route?: string | undefined;
  children?: MenuItem[] | undefined;
  childMenu?: string | undefined;
  selected?: boolean | undefined;
  expanded?: boolean | undefined;
  visbility?: boolean | undefined;
  constructor(partialMenuItem: Partial<IMenuItem>) {
    Object.assign(this, partialMenuItem);
    this.identifier = partialMenuItem.identifier ?? '';
    this.label = partialMenuItem.label ?? '';
    this.iconName = partialMenuItem.iconName ?? '';
    this.iconFill = partialMenuItem.iconFill ?? false;
    if(!this.visbility){
      this.visbility = true;
    }
    if(!this.selected){
      this.selected = false;
    }
    if(!this.expanded){
      this.expanded = false;
    }
  }
}
  