// import React from 'react';
// import ReactDOM from 'react-dom';
import React from './kreact';
import ReactDOM, {useState} from './kreact/react-dom';
import './index.css';
// import App from './App';
import reportWebVitals from './reportWebVitals';


function FuncComponent (props) {
  const [count, setCount] = useState(1);
  return (
    <div>
      FuncComponent-{props.name}
      <button onClick={()=>{setCount(count+1)}}>{count}</button>
      {count % 3 === 0 && <div>条件显示</div>}
    </div>
  )
}

class ClassComp extends React.Component {
  render() {
    return <div>ClassComponent-{this.props.name}</div>
  }
}



const jsx = <div className="container">
  <p className="color">测试react</p>
  <a href>测试react</a>
  <FuncComponent name="funComponent" />
  {/* <ClassComp name="classComp" /> */}
</div>

ReactDOM.render(
  jsx,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
