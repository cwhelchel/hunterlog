
/*
This fixes warnings for importing png files like:
    import pota_step1 from '../../assets/import_pota_1.png'

which is how we get images in the rendered html in Hunterlog
*/ 
declare module '*.png' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value: any;
  export = value;
}