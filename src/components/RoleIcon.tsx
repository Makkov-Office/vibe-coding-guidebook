import {iconProps,iconRoles} from '../design/icons.mjs';

/** An interface icon by its role (P2-06); filled is the active rail item's variant where one exists. */
export function RoleIcon({role,filled=false}:{role:keyof typeof iconRoles;filled?:boolean}){
 const entry=iconRoles[role] as {icon:typeof iconRoles.home.icon;filled?:typeof iconRoles.home.icon};
 const Icon=filled&&entry.filled?entry.filled:entry.icon;
 return <Icon {...iconProps}/>;
}
