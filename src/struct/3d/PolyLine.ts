import { EndType, JoinType } from "../../alg/extrude";
import { gPrecision } from "../../math/Math";
import { IVec3, Vec3 } from "../../math/Vec3";
import { ArrayEx } from "../data/ArrayEx";
import { Line } from "./Line";
import { Segment } from "./Segment";


/**
 *  线段正反原则：右手坐标系中，所在平面为XZ平面，把指向方向看着负Z轴，x正为正方向，x负为负方向
 */
export class Polyline extends ArrayEx {
    isCoPlanar: boolean;
    isPolyline: boolean = true;
    constructor(vs: Array<Vec3 | IVec3> = [], public normal: Vec3 = Vec3.UnitY) {
        super();
        Object.setPrototypeOf(this, Polyline.prototype);
        this.push(...vs);
        this.isCoPlanar = true;
    }

    /**
     * 偏移
     * @param {Number} distance  偏移距离  
     * @param {Vector3} normal  折线所在平面法线
     */
    offset(distance: number, normal: Vec3 = Vec3.UnitY, endtype: EndType = EndType.Butt, jointype: JoinType = JoinType.Miter): Polyline {
        const segs = []
        for (let i = 0; i < this.length - 1; i++) {
            const seg: Segment = new Segment(this[i].clone(), this[i + 1].clone());
            const segtangetvec = seg[1].clone().sub(seg[0]).normalize().applyAxisAngle(normal, Math.PI / 2).multiplyScalar(distance);
            seg.forEach((e: Vec3) => e.add(segtangetvec));

            segs.push(seg);
        }

        for (let i = 0; i < segs.length - 1; i++) {
            const segi: Segment = segs[i];
            for (let j = i + 1; j < segs.length; j++) {

                const segj = segs[j];

                const disRes = segi.distanceSegment(segj);
                if (disRes.distance! < gPrecision) {
                    //相交
                    segj[0].copy(disRes.closests![0])
                    segi[1].copy(disRes.closests![0])
                } else {
                    //判断是否在内
                    // var i_o = segi.direction.clone().cross(segj.p0.clone().sub(segi.p0)).dot(normal);

                }
            }
        }

        var offsetPts = []
        offsetPts.push(segs[0].p0)
        for (let i = 0; i < segs.length; i++) {
            const element = segs[i];
            offsetPts.push(element.p1)
        }

        return new Polyline(offsetPts);
    }



    /**
     * 圆角   将折线拐点圆角化
     * @param {Number} useDistance 圆角段距离 
     * @param {Number} segments 分切割段数
     */
    corner(useDistance: number, normal = this.normal): Polyline {
        var polyline: Polyline = new Polyline();
        for (let i = 0; i < this.length - 2; i++) {
            const p0: Vec3 = this[i];
            const p1: Vec3 = this[i + 1];
            const p2: Vec3 = this[i + 2];
            polyline.push(p0);
            var fixedPoint0 = p0.distanceTo(p1) <= useDistance * 2 ? p0.clone().add(p1).multiplyScalar(0.5) : p0.clone().sub(p1).normalize().multiplyScalar(useDistance).add(p1);
            var fixedPoint1 = p2.distanceTo(p1) <= useDistance * 2 ? p2.clone().add(p1).multiplyScalar(0.5) : p2.clone().sub(p1).normalize().multiplyScalar(useDistance).add(p1);
            polyline.push(fixedPoint0);
            var binormal0 = p1.clone().sub(p0).applyAxisAngle(normal, Math.PI / 2);
            var binormal1 = p1.clone().sub(p0).applyAxisAngle(normal, Math.PI / 2);
            //计算圆弧点
            var line0 = new Line(fixedPoint0, binormal0.add(fixedPoint0));
            var line1 = new Line(fixedPoint1, binormal1.add(fixedPoint1));


            polyline.push(fixedPoint1);

        }
        return polyline;
    }


}