import IBaseRefinerTemplateState from '../IBaseRefinerTemplateState';
import { IDropdownOption } from "office-ui-fabric-react";


interface IDropdownRefinerTemplateState extends IBaseRefinerTemplateState {

    /* Values that are selected by default */
    selectedItems?: any;
} 

export default IDropdownRefinerTemplateState;