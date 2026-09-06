/** Types for the `mersenne-twister` package (the reference mt19937ar.c in JavaScript). */
declare module 'mersenne-twister' {
  export default class MersenneTwister {
    /** An integer seeds `init_genrand`; an array of 32-bit words seeds `init_by_array`. */
    constructor(seed?: number | number[]);
    /** One raw 32-bit output (`genrand_int32`). */
    random_int(): number;
    /** A double in [0, 1) from 53 random bits (`genrand_res53`). */
    random_long(): number;
  }
}
