class Test {
    constructor (props) {
        this.props = props
    }
    static age = "test";
    static func () {console.log(this.age);}
    funct () {
        console.log("funct");
    }
    logProps () {
        console.log(this.props)
    }
}
class Test1 extends Test {
    constructor (props) {
        super(props);
    }
    static tall = "20"
}

const t = new Test("test");
console.log(Test.age);
Test.func();
t.funct();
t.logProps();

console.log(Test1.age);
Test1.func();