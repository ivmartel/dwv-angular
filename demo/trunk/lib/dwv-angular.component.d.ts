import { OnInit } from '@angular/core';
import { ToolConfig } from 'dwv';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import * as i0 from "@angular/core";
export declare class DwvComponent implements OnInit {
    dialog: MatDialog;
    showLegend: boolean;
    versions: {
        dwv: string;
        angular: string;
    };
    tools: {
        Scroll: ToolConfig;
        ZoomAndPan: ToolConfig;
        WindowLevel: ToolConfig;
        Draw: ToolConfig;
    };
    toolNames: string[];
    selectedTool: string;
    loadProgress: number;
    dataLoaded: boolean;
    private dwvApp;
    private metaData;
    private orientation;
    private dropboxDivId;
    private dropboxClassName;
    private borderClassName;
    private hoverClassName;
    constructor(dialog: MatDialog);
    ngOnInit(): void;
    /**
     * Get the icon of a tool.
     *
     * @param tool The tool name.
     * @returns The associated icon string.
     */
    getToolIcon: (tool: string) => string;
    /**
     * Handle a change tool event.
     * @param tool The new tool name.
     */
    onChangeTool: (tool: string) => void;
    /**
     * Check if a tool can be run.
     *
     * @param tool The tool name.
     * @returns True if the tool can be run.
     */
    canRunTool: (tool: string) => boolean;
    /**
     * For toogle button to not get selected.
     *
     * @param event The toogle change.
     */
    onSingleToogleChange: (event: MatButtonToggleChange) => void;
    /**
     * Toogle the viewer orientation.
     */
    toggleOrientation: () => void;
    /**
     * Handle a change draw shape event.
     * @param shape The new shape name.
     */
    private onChangeShape;
    /**
     * Handle a reset event.
     */
    onReset: () => void;
    /**
     * Open the DICOM tags dialog.
     */
    openTagsDialog: () => void;
    /**
     * Setup the data load drop box: add event listeners and set initial size.
     */
    private setupDropbox;
    /**
     * Default drag event handling.
     * @param event The event to handle.
     */
    private defaultHandleDragEvent;
    /**
     * Handle a drag over.
     * @param event The event to handle.
     */
    private onBoxDragOver;
    /**
     * Handle a drag leave.
     * @param event The event to handle.
     */
    private onBoxDragLeave;
    /**
     * Handle a drop event.
     * @param event The event to handle.
     */
    private onDrop;
    /**
     * Handle a an input[type:file] change event.
     * @param event The event to handle.
     */
    private onInputFile;
    /**
     * Show/hide the data load drop box.
     * @param show True to show the drop box.
     */
    private showDropbox;
    static ɵfac: i0.ɵɵFactoryDeclaration<DwvComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<DwvComponent, "dwv-angular", never, { "showLegend": { "alias": "showLegend"; "required": false; }; }, {}, never, never, true, never>;
}
