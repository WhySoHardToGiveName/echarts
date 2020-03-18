/*
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/


import * as zrUtil from 'zrender/src/core/util';
import ComponentModel from '../../model/Component';
import makeStyleMapper from '../../model/mixin/makeStyleMapper';
import axisModelCreator, { AxisModelExtendedInCreator } from '../axisModelCreator';
import * as numberUtil from '../../util/number';
import {AxisModelCommonMixin} from '../axisModelCommonMixin';
import ParallelAxis from './ParallelAxis';
import { ZRColor, ParsedValue } from '../../util/types';
import { AxisBaseOption } from '../axisCommonTypes';
import { StyleProps } from 'zrender/src/graphic/Style';
import Parallel from './Parallel';


// 'normal' means there is no "active intervals" existing.
export type ParallelActiveState = 'normal' | 'active' | 'inactive';
export type ParallelAxisInterval = number[];
type ParallelAreaSelectStyleKey = 'fill' | 'lineWidth' | 'stroke' | 'opacity';
export type ParallelAreaSelectStyleProps = Pick<StyleProps, ParallelAreaSelectStyleKey> & {
    // Selected area width.
    width: number;
}

export interface ParallelAxisOption extends AxisBaseOption {
    /**
     * 0, 1, 2, ...
     */
    dim?: number[];
    parallelIndex?: number;
    areaSelectStyle?: {
        width?: number;
        borderWidth?: number;
        borderColor?: ZRColor;
        color?: ZRColor;
        opacity?: number;
    };
    // Whether realtime update view when select.
    realtime?: boolean;
}

class ParallelAxisModel extends ComponentModel<ParallelAxisOption> {

    static type: 'baseParallelAxis';
    readonly type = ParallelAxisModel.type;

    axis: ParallelAxis;

    // Inject
    coordinateSystem: Parallel;

    /**
     * @readOnly
     */
    activeIntervals: ParallelAxisInterval[] = [];

    getAreaSelectStyle(): ParallelAreaSelectStyleProps {
        return makeStyleMapper(
            [
                ['fill', 'color'],
                ['lineWidth', 'borderWidth'],
                ['stroke', 'borderColor'],
                ['width', 'width'],
                ['opacity', 'opacity']
            ]
        )(this.getModel('areaSelectStyle')) as ParallelAreaSelectStyleProps;
    }

    /**
     * The code of this feature is put on AxisModel but not ParallelAxis,
     * because axisModel can be alive after echarts updating but instance of
     * ParallelAxis having been disposed. this._activeInterval should be kept
     * when action dispatched (i.e. legend click).
     *
     * @param intervals `interval.length === 0` means set all active.
     */
    setActiveIntervals(intervals: ParallelAxisInterval[]): void {
        var activeIntervals = this.activeIntervals = zrUtil.clone(intervals);

        // Normalize
        if (activeIntervals) {
            for (var i = activeIntervals.length - 1; i >= 0; i--) {
                numberUtil.asc(activeIntervals[i]);
            }
        }
    }

    /**
     * @param value When only attempting detect whether 'no activeIntervals set',
     *        `value` is not needed to be input.
     */
    getActiveState(value?: ParsedValue): ParallelActiveState {
        var activeIntervals = this.activeIntervals;

        if (!activeIntervals.length) {
            return 'normal';
        }

        if (value == null || isNaN(+value)) {
            return 'inactive';
        }

        // Simple optimization
        if (activeIntervals.length === 1) {
            var interval = activeIntervals[0];
            if (interval[0] <= value && value <= interval[1]) {
                return 'active';
            }
        }
        else {
            for (var i = 0, len = activeIntervals.length; i < len; i++) {
                if (activeIntervals[i][0] <= value && value <= activeIntervals[i][1]) {
                    return 'active';
                }
            }
        }

        return 'inactive';
    }

}

var defaultOption: ParallelAxisOption = {
    type: 'value',
    areaSelectStyle: {
        width: 20,
        borderWidth: 1,
        borderColor: 'rgba(160,197,232)',
        color: 'rgba(160,197,232)',
        opacity: 0.3
    },
    realtime: true,
    z: 10
};

ComponentModel.registerClass(ParallelAxisModel);

interface ParallelAxisModel extends AxisModelCommonMixin<ParallelAxisOption>,
    AxisModelExtendedInCreator<ParallelAxisOption> {}

zrUtil.mixin(ParallelAxisModel, AxisModelCommonMixin);

axisModelCreator<ParallelAxisOption, typeof ParallelAxisModel>(
    'parallel', ParallelAxisModel, defaultOption
);

export default ParallelAxisModel;
