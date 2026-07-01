import React,{Component,type ReactNode}from 'react'
interface P{children:ReactNode;fallback?:ReactNode}
interface St{hasError:boolean;error?:Error}
export class ErrorBoundary extends Component<P,St>{
  state:St={hasError:false}
  static getDerivedStateFromError(e:Error):St{return{hasError:true,error:e}}
  render(){
    if(this.state.hasError)return this.props.fallback??(<div className='p-6 text-center'><p className='text-red-500'>Something went wrong</p><button onClick={()=>this.setState({hasError:false})} className='btn-secondary mt-4'>Try again</button></div>)
    return this.props.children
  }
}
