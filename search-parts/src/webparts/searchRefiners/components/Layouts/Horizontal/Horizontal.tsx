import * as React from 'react';
import IFilterLayoutProps from '../IFilterLayoutProps';
import IHorizontalState from './IHorizontalSate';
import * as update from 'immutability-helper';
import {
    GroupedList,
    GroupShowAll,
    IGroup,
    IGroupDividerProps,
    IGroupedList
} from 'office-ui-fabric-react/lib/components/GroupedList/index';
import { Link } from 'office-ui-fabric-react/lib/Link';
import styles from './Horizontal.module.scss';
import * as strings from 'SearchRefinersWebPartStrings';
import TemplateRenderer from '../../Templates/TemplateRenderer';
import { groupBy, isEqual } from '@microsoft/sp-lodash-subset';
import { ITheme } from '@uifabric/styling';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Text as TextUI } from 'office-ui-fabric-react/lib/Text';

export default class Horizontal extends React.Component<IFilterLayoutProps, IHorizontalState> {

    private _groupedList: IGroupedList;

    public constructor(props: IFilterLayoutProps) {
        super(props);

        this.state = {
            items: [],
            groups: [],
            nonGrouped: []
        };

        this._removeAllFilters = this._removeAllFilters.bind(this);
        this._onRenderHeader = this._onRenderHeader.bind(this);
        this._onRenderCell = this._onRenderCell.bind(this);
    }

    public render(): React.ReactElement<IFilterLayoutProps> {
        //let noResultsElement: JSX.Element;
        const refinerWidth = this.props.horizontalRefinerPerRow ? Math.floor(100 / this.props.horizontalRefinerPerRow) - 5 : 100;
        var cssRefinerWidth = refinerWidth + '%';

        const renderLinkRemoveAll = this.props.hasSelectedValues ?
            (<div className={`${styles.horizontalLayout__filterPanel__body__removeAllFilters} ${this.props.hasSelectedValues && "hiddenLink"}`}>
                <Link
                    theme={this.props.themeVariant as ITheme}
                    onClick={this._removeAllFilters}>
                    {strings.RemoveAllFiltersLabel}
                </Link>
            </div>) : null;

        return (
            <div style={{
                height: '100%',
                position: 'relative',
            }}>
                <div dangerouslySetInnerHTML={{__html:
                    `<style> 
                        .ms-List-surface .ms-List-page{background:white; position: relative;width: 100%;} 
                        div[id*=GroupedListSection]{ 
                            position:absolute; 
                            width: 100%;
                            box-sizing: border-box;
                            box-shadow: rgba(0, 0, 0, 0.2) 0px 0px 2px 0px;
                            word-break: break-all;
                        } 
                        span[class^='css']{
                            font-weight: bold;
                            font-family: "Segoe UI Web (West European)",Segoe UI,-apple-system,BlinkMacSystemFont,Roboto,Helvetica Neue,sans-serif;
                            font-size: 14px;
                        }
                    </style>`
                    }}>
                </div>

                {
                    this.state.items.map((item, index)=>{
                        var itemHeader;
                        var isNotGrouped = this.state.nonGrouped.some((ng)=>{
                            if(item.key == ng.key){
                                itemHeader = ng.name;
                            }
                            return item.key == ng.key;
                        });
                        var group = [];
                        this.state.groups.some((g)=>{
                            if(g.key == item.key){
                                group.push(g)
                            }
                            return g.key == item.key;
                        })
                        return (
                            !isNotGrouped ? 
                            <div style={{display:"inline-block", width:cssRefinerWidth,verticalAlign:"top", margin:"5px"}}>
                                <GroupedList
                                    styles={{root:{width:"100%", zIndex:1000-index, fontWeight:"bold"}}}
                                    ref='groupedList'
                                    items={this.state.items}//need to operate on all items values wont show up if items is specific to group, might be bug with fabric ui
                                    componentRef={(g) => { this._groupedList = g; }}
                                    onRenderCell={this._onRenderCell}
                                    className={styles.horizontalLayout__filterPanel__body__group}
                                    onShouldVirtualize={() => false}
                                    listProps={{ onShouldVirtualize: () => false }}
                                    groupProps={
                                        {
                                            onRenderHeader: this._onRenderHeader,
                                        }
                                    }
                                    groups={group} />
                            </div> : 

                            <div style={{margin: "5px",display:"inline-block",  width:cssRefinerWidth}}>
                                <span className="bbRefinerTitle" style={{fontWeight:"bold"}}>{itemHeader}</span>
                                {item}
                            </div>
                        )
                    })
                }
                {/* Old rendering for dropdown, will render dropdown refiners first
                    this.state.nonGrouped.map((ng)=>{ 
                return ( 
                    <div style={{margin: "5px",display:"inline-block", width:"30%"}}>
                        <span className="bbRefinerTitle" style={{fontWeight:"bold"}}>{ng.name}</span>
                        {this.state.items[ng.key]}
                    </div>
                    )
                })*/}
                {/*renderAvailableFilters*/
                /*  Old group rendering will render after dropdown refiners

                    this.state.groups.map((g,index)=>{
                        var thisItem = this.state.items[index];
                        var arr = [thisItem];
                        var garr = [g];
                    return (
                        <div style={{display:"inline-block", width:"30%",verticalAlign:"top", margin:"5px"}}>
                            <GroupedList
                                styles={{root:{width:"100%", zIndex:1000-index}}}
                                ref='groupedList'
                                items={this.state.items}
                                componentRef={(g) => { this._groupedList = g; }}
                                onRenderCell={this._onRenderCell}
                                className={styles.horizontalLayout__filterPanel__body__group}
                                onShouldVirtualize={() => false}
                                listProps={{ onShouldVirtualize: () => false }}
                                groupProps={
                                    {
                                        onRenderHeader: this._onRenderHeader,

                                    }
                                }
                                groups={garr} />
                        </div>
                    )
                    })
                */   
                }
                {renderLinkRemoveAll}
            </div>
        );
    }

    public componentDidMount() {
        this._initGroups(this.props);
        this._initItems(this.props);
    }

    public UNSAFE_componentWillReceiveProps(nextProps: IFilterLayoutProps) {

        let shouldReset = false;

        if (!isEqual(this.props.refinersConfiguration, nextProps.refinersConfiguration)) {
            shouldReset = true;
        }

        this._initGroups(nextProps, shouldReset);
        this._initItems(nextProps);

        // Need to force an update manually because nor items or groups update will be considered as an update by the GroupedList component.
        if(this._groupedList ) this._groupedList.forceUpdate();
    }

    private _onRenderCell(nestingDepth: number, item: any, itemIndex: number) {
        return (
            <div className={styles.horizontalLayout__filterPanel__body__group__item} data-selection-index={itemIndex}>
                {item}
            </div>
        );
    }

    private _onRenderHeader(props: IGroupDividerProps): JSX.Element {

        return (
            <div className={styles.horizontalLayout__filterPanel__body__group__header}
                style={props.groupIndex > 0 ? { marginTop: '10px' } : undefined}
                onClick={() => {
                    props.onToggleCollapse(props.group);
                }}>
                <div className={styles.horizontalLayout__filterPanel__body__headerIcon}>
                    {props.group.isCollapsed ?
                        <Icon iconName='ChevronDown' />
                        :
                        <Icon iconName='ChevronUp' />
                    }
                </div>
                <TextUI variant={'large'}>{props.group.name}</TextUI>
            </div>
        );
    }

    private _removeAllFilters() {
        this.props.onRemoveAllFilters();
    }

    /***
     * Initializes expanded groups
     * @param refinementResults the refinements results
     * @param refinersConfiguration the current refiners configuration
     */
    private _initGroups(props: IFilterLayoutProps, shouldResetCollapse?: boolean) {

        let groups: IGroup[] = [];
        var nonGroup = [];
        var refinementconfig = this.props.refinersConfiguration;

        props.refinementResults.map((refinementResult, i) => {

            // Get group name
            let groupName = refinementResult.FilterName;
            const configuredFilters = props.refinersConfiguration.filter(e => { return e.refinerName === refinementResult.FilterName; });
            groupName = configuredFilters.length > 0 && configuredFilters[0].displayValue ? configuredFilters[0].displayValue : groupName;
            let isCollapsed = true;

            // Check if the current filter is selected. If this case, we expand the group automatically
            const isFilterSelected = props.selectedFilters.filter(filter => { return filter.FilterName === refinementResult.FilterName; }).length > 0;

            const existingGroups = this.state.groups.filter(g => { return g.name === groupName; });

            if (existingGroups.length > 0 && !shouldResetCollapse) {
                isCollapsed = existingGroups[0].isCollapsed;
            } else {
                isCollapsed = (configuredFilters.length > 0 && configuredFilters[0].showExpanded) || isFilterSelected ? false : true;
            }

            let group: IGroup = {
                key: i.toString(),
                name: groupName,
                count: 1,
                startIndex: i,
                isCollapsed: isCollapsed
            };

            refinementconfig.filter((config)=>{
                if(config.refinerName == refinementResult.FilterName){
                    if(config.template == 10) nonGroup.push(group)
                    else groups.push(group);
                }
            })
            
        });



        this.setState({
            groups: update(this.state.groups, { $set: groups }),
            nonGrouped: update(this.state.nonGrouped, {$set: nonGroup})
        });
    }

    /**
     * Initializes items in for goups in the GroupedList
     * @param refinementResults the refinements results
     */
    private _initItems(props: IFilterLayoutProps): void {

        let items: JSX.Element[] = [];

        // Initialize the Office UI grouped list
        props.refinementResults.map((refinementResult, i) => {

            const configuredFilter = props.refinersConfiguration.filter(e => { return e.refinerName === refinementResult.FilterName; });

            // Get selected values for this specfic refiner
            // This scenario happens due to the behavior of the Office UI Fabric GroupedList component who recreates child components when a greoup is collapsed/expanded, causing a state reset for sub components
            // In this case we use the refiners global state to recreate the 'local' state for this component
            const selectedFilter = props.selectedFilters.filter(filter => { return filter.FilterName === refinementResult.FilterName; });
            const selectedFilterValues = selectedFilter.length === 1 ? selectedFilter[0].Values : [];
            items.push(
                <TemplateRenderer
                    key={i}
                    refinerConfiguration={!!configuredFilter[0] ? configuredFilter[0] : null}
                    refinementResult={refinementResult}
                    shouldResetFilters={props.shouldResetFilters}
                    templateType={!!configuredFilter[0] ? configuredFilter[0].template : null}
                    onFilterValuesUpdated={props.onFilterValuesUpdated}
                    language={props.language}
                    themeVariant={props.themeVariant}
                    selectedValues={selectedFilterValues}
                    userService={this.props.userService}
                    showValueFilter={!!configuredFilter[0]  && !!configuredFilter[0].showValueFilter ? configuredFilter[0].showValueFilter : false}
                />
            );
        });

        this.setState({
            items: update(this.state.items, { $set: items })
        });
    }
}
