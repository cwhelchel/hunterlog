
/*
This fixes warnings for importing png files like:
    import pota_step1 from '../../assets/import_pota_1.png'

which is how we get images in the rendered html in Hunterlog.

update: this is no longer needed thanks to new loading (old way broke)
     const pota_step1 = new URL(<filepath>, import.meta.url)
*/ 
declare module '*.png' {
  const src: string;
  export default src;
}