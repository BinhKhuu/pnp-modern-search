import * as React from "react";
import IBaseRefinerTemplateProps from '../IBaseRefinerTemplateProps';
//import IBaseRefinerTemplateState from '../IBaseRefinerTemplateState';
import IDropdownRefinerTemplateState from './DropdownTemplateState';
import { IRefinementValue, RefinementOperator } from "../../../../../models/ISearchResult";
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { Text } from '@microsoft/sp-core-library';
import { Link } from 'office-ui-fabric-react/lib/Link';
//import * as strings from 'SearchRefinersWebPartStrings';
import * as update from 'immutability-helper';
import { ITheme, noWrap } from "@uifabric/styling";
import { selectProperties, TextField } from "office-ui-fabric-react";

//CSS
//import styles from './CheckboxTemplate.module.scss';

export default class DropdownTemplate extends React.Component<IBaseRefinerTemplateProps, IDropdownRefinerTemplateState> {

    private _operator: RefinementOperator;
    
    public constructor(props: IBaseRefinerTemplateProps) {
        super(props);
       
        this.state = {
            refinerSelectedFilterValues: [],
            selectedItems: this.props.selectedValues
        
        };

        this._onFilterAdded = this._onFilterAdded.bind(this);
        this._onFilterRemoved = this._onFilterRemoved.bind(this);
        this._applyFilters = this._applyFilters.bind(this);
        this._clearFilters = this._clearFilters.bind(this);
        this._onValueFilterChanged = this._onValueFilterChanged.bind(this);
        this._isFilterMatch = this._isFilterMatch.bind(this);
        this._clearValueFilter = this._clearValueFilter.bind(this);
    }

    public render() {

        let disableButtons = false;

        if ((this.props.selectedValues.length === 0 && this.state.refinerSelectedFilterValues.length === 0)) {
            disableButtons = true;
        }

        var ddOptions: IDropdownOption[] = new Array();
        this.props.refinementResult.Values.filter(x => { return !this._isFilterMatch(x);}).map((refinementValue: IRefinementValue, j) => {
            var key = refinementValue.RefinementToken;
            var value = refinementValue.RefinementValue;
            var opt: IDropdownOption = {key:key,text:value};
            ddOptions.push(opt);
        })

        return <div className={"bbDropdownRefiner"}>
            {     
                <div>
                    <Dropdown
                        style={{}}
                        styles={{dropdownOptionText:{whiteSpace:"hidden",fontSize:"14px"}}}
                        options={ddOptions}
                        //selectedKey={this.state.selectedItems}
                        multiSelect={true}
                        selectedKeys={this.state.selectedItems}
                        onChange={(ev, option) => {
                            if(option.selected){
                                var refinementValue = this.props.refinementResult.Values.filter((val)=>{
                                    if(val.RefinementToken == option.key) return true;
                                })
                                if(refinementValue.length) this._onFilterAdded(refinementValue[0])
                            }
                            else {
                                if(this.state.selectedItems.length > 0){
                                    var refinementValue = this.props.refinementResult.Values.filter((val)=>{
                                        if(val.RefinementToken == option.key) return true;
                                    })
                                    if(refinementValue.length) this._onFilterRemoved(refinementValue[0])
                                }
                                else {
                                    this._clearFilters();
                                }
                            }
                        }} 
                    >
                    </Dropdown>
                </div>

            }
            {
                this.props.isMultiValue ?

                    <div>
                        <Link
                            theme={this.props.themeVariant as ITheme}
                            onClick={() => { this._applyFilters(this.state.refinerSelectedFilterValues); }}
                            disabled={disableButtons}>{"Apply filters"}
                        </Link>{'\u00A0'}|{'\u00A0'}<Link theme={this.props.themeVariant as ITheme}  onClick={this._clearFilters} disabled={this.state.refinerSelectedFilterValues.length === 0}>{"Clear filters"}</Link>
                    </div>

                    : null 
            }
        </div>;
    }

    public componentDidMount() {

        // Determine the operator according to multi value setting
        this._operator = this.props.isMultiValue ? RefinementOperator.OR : RefinementOperator.AND;
        // This scenario happens due to the behavior of the Office UI Fabric GroupedList component who recreates child components when a greoup is collapsed/expanded, causing a state reset for sub components
        // In this case we use the refiners global state to recreate the 'local' state for this component
        this.setState({
            refinerSelectedFilterValues: this.props.selectedValues
        });
    }

    public UNSAFE_componentWillReceiveProps(nextProps: IBaseRefinerTemplateProps) {

        if (nextProps.shouldResetFilters) {
            this.setState({
                refinerSelectedFilterValues: [],
                selectedItems:[]
            });
        }

        // Remove an arbitrary value from the inner state
        // Useful when the remove filter action is also present in the parent layout component
        if (nextProps.removeFilterValue) {

            const newFilterValues = this.state.refinerSelectedFilterValues.filter((elt) => {
                return elt.RefinementValue !== nextProps.removeFilterValue.RefinementValue;
            });

            this.setState({
                refinerSelectedFilterValues: newFilterValues
            });

            this._applyFilters(newFilterValues);
        }
    }

    /**
     * Checks if the current filter value is present in the list of the selected values for the current refiner
     * @param valueToCheck The filter value to check
     */
    private _isValueInFilterSelection(valueToCheck: IRefinementValue): boolean {

        let newFilters = this.state.refinerSelectedFilterValues.filter((filter) => {
            return filter.RefinementToken === valueToCheck.RefinementToken && filter.RefinementValue === valueToCheck.RefinementValue;
        });

        return newFilters.length === 0 ? false : true;
    }

    /**
     * Handler when a new filter value is selected
     * @param addedValue the filter value added
     */
    private _onFilterAdded(addedValue: IRefinementValue) {
        //set state for selectedItems using addedValue.RefinementToken
        let newFilterValues = update(this.state.refinerSelectedFilterValues, { $push: [addedValue] });
        let newSelectedItem = update(this.state.selectedItems,{$push: [addedValue.RefinementToken]})

        this.setState({
            refinerSelectedFilterValues: newFilterValues,
            selectedItems: newSelectedItem
        });

        //this._applyFilters(newFilterValues);
        
        if (!this.props.isMultiValue) {
            this._applyFilters(newFilterValues);
        }
        
    }

    /**
     * Handler when a filter value is unselected
     * @param removedValue the filter value removed
     */
    private _onFilterRemoved(removedValue: IRefinementValue) {
        //remove value by poping addedValue.RefinementToken
        const newFilterValues = this.state.refinerSelectedFilterValues.filter((elt) => {
            return elt.RefinementValue !== removedValue.RefinementValue;
        });

        var newSelectedItems = this.state.selectedItems.filter((sel)=>{
            return sel !== removedValue.RefinementToken;
        })
        this.setState({
            refinerSelectedFilterValues: newFilterValues,
            selectedItems:newSelectedItems
        });
        //this._applyFilters(newFilterValues);
        
        if (!this.props.isMultiValue) {
            this._applyFilters(newFilterValues);
        }
        
    }

    /**
     * Applies all selected filters for the current refiner
     */
    private _applyFilters(updatedValues: IRefinementValue[]) {
        this.props.onFilterValuesUpdated(this.props.refinementResult.FilterName, updatedValues, this._operator);
    }

    /**
     * Clears all selected filters for the current refiner
     */
    private _clearFilters() {

        this.setState({
            refinerSelectedFilterValues: [],
            selectedItems:[]
        });

        this._applyFilters([]);
    }

    /**
     * Checks if an item-object matches the provided refinement value filter value
     * @param item The item-object to be checked
     */
    private _isFilterMatch(item: IRefinementValue): boolean {
        if(!this.state.valueFilter) { return false; }
        const isSelected = this.state.refinerSelectedFilterValues.some(selectedValue => selectedValue.RefinementValue === item.RefinementValue);
        if(isSelected) { return false; }
        return item.RefinementValue.toLowerCase().indexOf(this.state.valueFilter.toLowerCase()) === -1;
    }

    /**
     * Event triggered when a new value is provided in the refinement value filter textfield.
     * @param newvalue The new value provided through the textfield
     */
    private _onValueFilterChanged(newValue: string) {
        this.setState({
            valueFilter: newValue,
            selectedItems:[]
        });
    }

    /**
     * Clears the filter applied to the refinement values
     */
    private _clearValueFilter() {
        this.setState({
            valueFilter: "",
            selectedItems:[]
        });
    }

    /**
     * Prevents the parent group to be colapsed
     * @param event The event that triggered the click
     */
    private _onValueFilterClick(event: React.MouseEvent<HTMLInputElement | HTMLTextAreaElement, MouseEvent>) {
        event.stopPropagation();
    }
}
