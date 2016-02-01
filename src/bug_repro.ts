declare var Bar: IBar
interface Foo<T> {}
interface IBar {
    baz<T>(a: () => T): Foo<T>;
    baz<T>(a: () => Foo<T>): Foo<T>;
}

module Bug {
    export function ShowBug<T>(callback: () => T|Foo<T>) {
        var foo = Bar.baz<T>(callback);
    }
}
