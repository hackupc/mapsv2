import * as Three from "three"
import Util from "./Util"
import World from "./World"
import HMap from "./HMap"
import {MatchedRoute} from "./Router"

/**
 * A function that receives an object with the route params
 * and returns the properties of the objects for that route
 */
type PropsCallback = (params:{[param: string]: string}) => object
type RenderCallback = (world:World) => Promise<any>

export interface ControllerConfig{
	title: string,
	render: string | object | RenderCallback,
	controller?: typeof Controller,
	backTo?: string,
	viewId?: string,
	props?: object | PropsCallback
}

export default class Controller{
	config: ControllerConfig
	params: any

	constructor(matching: MatchedRoute){
		this.config = matching.config
		this.params = matching.params
		
		const formattedTitle = Util.format(
			matching.config.title,
			matching.params
		)
		this.setTitle(formattedTitle)
		if (this.config.backTo) {
			const btn = document.getElementById(HMap.BACK_ID)
			btn.dataset.backTo = this.config.backTo
			Util.show("#"+HMap.BACK_ID)
		}
	}

	/**
	 * Sets the view title
	 *
	 * @arg {string} title - The new title
	 */
	setTitle(title:string){
		document.getElementById(HMap.TITLE_ID).innerHTML = title
	}

	/**
	 * Clones the template into the view container
	 *
	 * @arg {string} templateId - The id of the template to be imported
	 */
	importTemplate(templateId:string): void {
		const view = document.getElementById(HMap.VIEW_CONTAINER_ID)
		const template = <HTMLTemplateElement>document.getElementById(templateId)
		Util.replaceTemplate(view, template)
	}

	/**
	 * Hides the view and empties the view container
	 * Also hides the back button
	 */
	hiding(): Promise<void> {
		Util.hide("#"+HMap.BACK_ID)
		if (!this.config.viewId) 
			return Promise.resolve()

		return Util.hide("#"+HMap.VIEW_CONTAINER_ID).then(()=>{
			Util.emptyNode(
				document.getElementById(HMap.VIEW_CONTAINER_ID)
			)
		})
	}

	/**
	 * Imports and shows the template specified in the config
	 */
	showing(): Promise<void> {
		if (!this.config.viewId) 
			return Promise.resolve()

		this.importTemplate(this.config.viewId)
		return Util.show("#"+HMap.VIEW_CONTAINER_ID)
	}

	/**
	 * Renders the scene specified by the config into the world
	 *
	 * @arg {World} world - The world where the scene will be rendered
	 */
	initScene(world:World): Promise<any>{
		if(typeof this.config.render === "object") {
			const ps = []
			for(const key in this.config.render) {
				//Path may contains parameters
				const formatted = Util.format(
					this.config.render[key],
					this.params
				)
				ps.push(formatted)
			}
			
			const addFromFileWithProps = (path) => 
				world.addFromFile(path, this.config.props)

			return Promise.all(
				ps.map(addFromFileWithProps)
			)
		}
		else if(typeof this.config.render === "string") {
			//Path may contains parameters
			const formatted = Util.format(
				this.config.render,
				this.params
			)
			return world.addFromFile(formatted, this.config.props)
		}
		else {
			console.error("Render value not compatible:" + this.config.render)
			return Promise.reject()
		}
	}
}