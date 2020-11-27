import { IGroup } from "office-ui-fabric-react/lib/components/GroupedList";

interface IHorizontalState {
    groups?: IGroup[];
    items?: JSX.Element[];
    nonGrouped?:any;
}

export default IHorizontalState;