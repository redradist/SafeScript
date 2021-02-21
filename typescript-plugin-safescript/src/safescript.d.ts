declare namespace SafeScript {
    function add(left: any, right: any): any;
    function sub(left: any, right: any): number;
    function mul(left: any, right: any): number;
    function div(left: any, right: any): number;
    function mod(left: any, right: any): number;
    function exp(left: any, right: any): number;
    function eq(left: any, right: any): boolean;
    function ne(left: any, right: any): boolean;
    function gt(left: any, right: any): boolean;
    function ge(left: any, right: any): boolean;
    function lt(left: any, right: any): boolean;
    function le(left: any, right: any): boolean;
    function and(left: any, right: any): number;
    function or(left: any, right: any): number;
    function xor(left: any, right: any): number;
    function rshfit(left: any, right: any): number;
    function arshift(left: any, right: any): number;
    function lshift(left: any, right: any): number;
    function plus(any): number;
    function minus(any): number;
    function bit_not(any): number;
    function inc(any): number;
    function dec(any): number;
    function suffix(): number;
}
